use std::{
    collections::BTreeMap,
    env,
    fs::File,
    io::{BufReader, BufWriter, Error, ErrorKind},
    path::PathBuf,
};

use rbx_dom_weak::{
    WeakDom,
    types::{Color3, Color3uint8, Content, ContentId, Variant, VariantType},
};
use rbx_reflection::{PropertyDescriptor, PropertyKind, PropertySerialization, ReflectionDatabase};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = env::args_os();
    let _exe = args.next();
    let input = PathBuf::from(args.next().ok_or_else(|| {
        Error::new(
            ErrorKind::InvalidInput,
            "usage: rbxlx2rbxl <input.rbxlx> <output.rbxl>",
        )
    })?);
    let output = PathBuf::from(args.next().ok_or_else(|| {
        Error::new(
            ErrorKind::InvalidInput,
            "usage: rbxlx2rbxl <input.rbxlx> <output.rbxl>",
        )
    })?);

    if args.next().is_some() {
        return Err(Error::new(
            ErrorKind::InvalidInput,
            "usage: rbxlx2rbxl <input.rbxlx> <output.rbxl>",
        )
        .into());
    }

    let input = BufReader::new(File::open(&input)?);
    let mut dom = rbx_xml::from_reader(input, rbx_xml::DecodeOptions::default())?;
    let database = rbx_reflection_database::get()?;

    let summary = coerce_dom(&mut dom, database);

    let output_file = BufWriter::new(File::create(&output)?);
    rbx_binary::to_writer(output_file, &dom, &dom.root().children())?;

    print_summary(&summary);
    println!("wrote {}", output.display());
    Ok(())
}

#[derive(Default)]
struct Summary {
    coerced: BTreeMap<String, usize>,
    dropped: Vec<String>,
}

fn print_summary(summary: &Summary) {
    let total: usize = summary.coerced.values().sum();
    println!("coerced properties: {total}");
    for (key, count) in &summary.coerced {
        println!("  {key}: {count}");
    }
    println!("dropped properties: {}", summary.dropped.len());
    for dropped in &summary.dropped {
        println!("  {dropped}");
    }
}

fn coerce_dom(dom: &mut WeakDom, database: &ReflectionDatabase<'_>) -> Summary {
    let mut summary = Summary::default();
    let refs: Vec<_> = dom.descendants().map(|inst| inst.referent()).collect();

    for referent in refs {
        let Some(instance) = dom.get_by_ref_mut(referent) else {
            continue;
        };

        let class_name = instance.class.as_str();
        let prop_names: Vec<_> = instance.properties.keys().copied().collect();

        for prop_name in prop_names {
            let Some(current_value) = instance.properties.get(&prop_name).cloned() else {
                continue;
            };

            let Some(descriptor) =
                find_canonical_property_descriptor(class_name, prop_name.as_str(), database)
            else {
                continue;
            };

            let target_type = descriptor.data_type.ty();
            let actual_type = current_value.ty();
            if actual_type == target_type {
                continue;
            }

            match coerce_variant(&current_value, target_type) {
                Ok(new_value) => {
                    instance.properties.insert(prop_name, new_value);
                    let key = format!(
                        "{}::{}: {:?}->{:?}",
                        class_name,
                        prop_name.as_str(),
                        actual_type,
                        target_type
                    );
                    *summary.coerced.entry(key).or_insert(0) += 1;
                }
                Err(reason) => {
                    instance.properties.remove(&prop_name);
                    summary.dropped.push(format!(
                        "{}::{}: {:?}->{:?} ({reason})",
                        class_name,
                        prop_name.as_str(),
                        actual_type,
                        target_type
                    ));
                }
            }
        }
    }

    summary
}

fn find_canonical_property_descriptor<'db>(
    class_name: &str,
    property_name: &str,
    database: &'db ReflectionDatabase<'db>,
) -> Option<&'db PropertyDescriptor<'db>> {
    let mut current = database.classes.get(class_name)?;
    loop {
        if let Some(descriptor) = current.properties.get(property_name) {
            match &descriptor.kind {
                PropertyKind::Canonical { serialization } => match serialization {
                    PropertySerialization::Serializes | PropertySerialization::Migrate(_) => {
                        return Some(descriptor);
                    }
                    PropertySerialization::DoesNotSerialize => return None,
                    PropertySerialization::SerializesAs(serialized_name) => {
                        return current.properties.get(serialized_name);
                    }
                    _ => return None,
                },
                PropertyKind::Alias { alias_for } => {
                    let canonical = current.properties.get(alias_for)?;
                    match &canonical.kind {
                        PropertyKind::Canonical { serialization } => match serialization {
                            PropertySerialization::Serializes
                            | PropertySerialization::Migrate(_) => return Some(canonical),
                            PropertySerialization::DoesNotSerialize => return None,
                            PropertySerialization::SerializesAs(serialized_name) => {
                                return current.properties.get(serialized_name);
                            }
                            _ => return None,
                        },
                        PropertyKind::Alias { .. } => return None,
                        _ => return None,
                    }
                }
                _ => return None,
            }
        }

        current = match current.superclass {
            Some(superclass) => database.classes.get(superclass)?,
            None => return None,
        };
    }
}

fn coerce_variant(value: &Variant, target_type: VariantType) -> Result<Variant, String> {
    match (value, target_type) {
        (Variant::Color3uint8(v), VariantType::Color3) => Ok(Color3::from(*v).into()),
        (Variant::Color3(v), VariantType::Color3uint8) => Ok(Color3uint8::from(*v).into()),

        (Variant::Int32(v), VariantType::Int64) => Ok(i64::from(*v).into()),
        (Variant::Int64(v), VariantType::Int32) => {
            let narrowed: i32 = (*v)
                .try_into()
                .map_err(|_| format!("value {v} does not fit into Int32"))?;
            Ok(narrowed.into())
        }
        (Variant::Float32(v), VariantType::Float64) => Ok(f64::from(*v).into()),
        (Variant::Float64(v), VariantType::Float32) => Ok((*v as f32).into()),

        (Variant::BrickColor(v), VariantType::Int32) => Ok((*v as i32).into()),
        (Variant::Int32(v), VariantType::BrickColor) => {
            let narrowed: u16 = (*v)
                .try_into()
                .map_err(|_| format!("value {v} is not a valid BrickColor number"))?;
            rbx_dom_weak::types::BrickColor::from_number(narrowed)
                .map(Into::into)
                .ok_or_else(|| format!("{v} is not a valid BrickColor number"))
        }

        (Variant::ContentId(v), VariantType::Content) => {
            if v.as_str().is_empty() {
                Ok(Content::none().into())
            } else {
                Ok(Content::from(v.as_str()).into())
            }
        }
        (Variant::Content(v), VariantType::ContentId) => match v.value() {
            rbx_dom_weak::types::ContentType::None => Ok(ContentId::new().into()),
            rbx_dom_weak::types::ContentType::Uri(uri) => Ok(ContentId::from(uri.as_str()).into()),
            rbx_dom_weak::types::ContentType::Object(_) => {
                Err(String::from("objects cannot be coerced into ContentId"))
            }
            _ => Err(String::from("unknown Content variant")),
        },
        (Variant::String(v), VariantType::Content) => {
            if v.is_empty() {
                Ok(Content::none().into())
            } else {
                Ok(Content::from(v.as_str()).into())
            }
        }
        (Variant::String(v), VariantType::ContentId) => Ok(ContentId::from(v.as_str()).into()),
        (Variant::Content(v), VariantType::String) => match v.value() {
            rbx_dom_weak::types::ContentType::None => Ok(String::new().into()),
            rbx_dom_weak::types::ContentType::Uri(uri) => Ok(uri.clone().into()),
            rbx_dom_weak::types::ContentType::Object(_) => {
                Err(String::from("objects cannot be coerced into String"))
            }
            _ => Err(String::from("unknown Content variant")),
        },
        (Variant::ContentId(v), VariantType::String) => Ok(v.as_str().to_owned().into()),

        (Variant::EnumItem(v), VariantType::Enum) => {
            Ok(rbx_dom_weak::types::Enum::from_u32(v.value).into())
        }

        (Variant::BinaryString(v), VariantType::String) => {
            let bytes: &[u8] = v.as_ref();
            String::from_utf8(bytes.to_vec())
                .map(Into::into)
                .map_err(|e| format!("invalid UTF-8 in BinaryString: {e}"))
        }
        (Variant::String(v), VariantType::BinaryString) => {
            Ok(rbx_dom_weak::types::BinaryString::from(v.as_bytes()).into())
        }
        (Variant::ContentId(v), VariantType::BinaryString) => {
            Ok(rbx_dom_weak::types::BinaryString::from(v.as_str().as_bytes()).into())
        }
        (Variant::Content(v), VariantType::BinaryString) => match v.value() {
            rbx_dom_weak::types::ContentType::None => {
                Ok(rbx_dom_weak::types::BinaryString::new().into())
            }
            rbx_dom_weak::types::ContentType::Uri(uri) => {
                Ok(rbx_dom_weak::types::BinaryString::from(uri.as_bytes()).into())
            }
            rbx_dom_weak::types::ContentType::Object(_) => {
                Err(String::from("objects cannot be coerced into BinaryString"))
            }
            _ => Err(String::from("unknown Content variant")),
        },
        (Variant::BinaryString(v), VariantType::Tags) => {
            let bytes: &[u8] = v.as_ref();
            let tags = rbx_dom_weak::types::Tags::decode(bytes)
                .map_err(|e| format!("failed to decode Tags: {e}"))?;
            Ok(tags.into())
        }
        (Variant::String(v), VariantType::Tags) => {
            let tags = rbx_dom_weak::types::Tags::decode(v.as_bytes())
                .map_err(|e| format!("failed to decode Tags: {e}"))?;
            Ok(tags.into())
        }
        (Variant::SharedString(v), VariantType::Tags) => {
            let tags = rbx_dom_weak::types::Tags::decode(v.data())
                .map_err(|e| format!("failed to decode Tags from SharedString: {e}"))?;
            Ok(tags.into())
        }
        (Variant::Tags(v), VariantType::BinaryString) => {
            Ok(rbx_dom_weak::types::BinaryString::from(v.encode()).into())
        }
        (Variant::BinaryString(v), VariantType::Attributes) => {
            let bytes: &[u8] = v.as_ref();
            let attrs = rbx_dom_weak::types::Attributes::from_reader(std::io::Cursor::new(bytes))
                .map_err(|e| format!("failed to decode Attributes: {e}"))?;
            Ok(attrs.into())
        }
        (Variant::Attributes(v), VariantType::BinaryString) => {
            let mut bytes = Vec::new();
            v.to_writer(&mut bytes)
                .map_err(|e| format!("failed to encode Attributes: {e}"))?;
            Ok(rbx_dom_weak::types::BinaryString::from(bytes).into())
        }
        (Variant::BinaryString(v), VariantType::MaterialColors) => {
            let bytes: &[u8] = v.as_ref();
            let colors = rbx_dom_weak::types::MaterialColors::decode(bytes)
                .map_err(|e| format!("failed to decode MaterialColors: {e}"))?;
            Ok(colors.into())
        }
        (Variant::MaterialColors(v), VariantType::BinaryString) => {
            Ok(rbx_dom_weak::types::BinaryString::from(v.encode()).into())
        }

        _ if value.ty() == target_type => Ok(value.clone()),

        _ => Err(format!(
            "no coercion path from {:?} to {:?}",
            value.ty(),
            target_type
        )),
    }
}
