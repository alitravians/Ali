package com.arabizi.keyboard.settings;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.CompoundButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RadioGroup;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.arabizi.keyboard.R;
import com.arabizi.keyboard.theme.ThemeManager;
import com.arabizi.keyboard.utils.KeyboardPreferences;
import com.google.android.material.switchmaterial.SwitchMaterial;

/**
 * Settings activity for configuring keyboard preferences.
 * All settings are persisted using SharedPreferences.
 */
public class SettingsActivity extends AppCompatActivity {

    private KeyboardPreferences preferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        preferences = new KeyboardPreferences(this);

        // Back button
        ImageView btnBack = findViewById(R.id.btn_back);
        btnBack.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        setupSettings();
        setupTheme();
        setupDictionary();
        setupVersion();
    }

    private void setupSettings() {
        // Autocorrect
        setupSwitch(
                findViewById(R.id.setting_autocorrect),
                getString(R.string.settings_autocorrect),
                getString(R.string.settings_autocorrect_desc),
                preferences.isAutocorrectEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        preferences.setAutocorrectEnabled(isChecked);
                    }
                }
        );

        // Suggestions
        setupSwitch(
                findViewById(R.id.setting_suggestions),
                getString(R.string.settings_suggestions),
                getString(R.string.settings_suggestions_desc),
                preferences.isSuggestionsEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        preferences.setSuggestionsEnabled(isChecked);
                    }
                }
        );

        // Auto Convert
        setupSwitch(
                findViewById(R.id.setting_auto_convert),
                getString(R.string.settings_auto_convert),
                getString(R.string.settings_auto_convert_desc),
                preferences.isAutoConvertEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        preferences.setAutoConvertEnabled(isChecked);
                    }
                }
        );

        // Translation
        setupSwitch(
                findViewById(R.id.setting_translation),
                getString(R.string.settings_translation),
                getString(R.string.settings_translation_desc),
                preferences.isTranslationEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        preferences.setTranslationEnabled(isChecked);
                    }
                }
        );

        // Vibration
        setupSwitch(
                findViewById(R.id.setting_vibration),
                getString(R.string.settings_vibration),
                getString(R.string.settings_vibration_desc),
                preferences.isVibrationEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        preferences.setVibrationEnabled(isChecked);
                    }
                }
        );

        // Sound
        setupSwitch(
                findViewById(R.id.setting_sound),
                getString(R.string.settings_sound),
                getString(R.string.settings_sound_desc),
                preferences.isSoundEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        preferences.setSoundEnabled(isChecked);
                    }
                }
        );
    }

    private void setupSwitch(View container, String title, String desc,
                             boolean defaultValue, CompoundButton.OnCheckedChangeListener listener) {
        if (container == null) return;

        TextView tvTitle = container.findViewById(R.id.setting_title);
        TextView tvDesc = container.findViewById(R.id.setting_desc);
        final SwitchMaterial switchView = container.findViewById(R.id.setting_switch);

        if (tvTitle != null) tvTitle.setText(title);
        if (tvDesc != null) tvDesc.setText(desc);
        if (switchView != null) {
            switchView.setChecked(defaultValue);
            switchView.setOnCheckedChangeListener(listener);

            // Make entire row clickable to toggle the switch
            container.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    switchView.setChecked(!switchView.isChecked());
                }
            });
        }
    }

    private void setupTheme() {
        RadioGroup themeGroup = findViewById(R.id.theme_group);

        // Set current theme
        String currentTheme = preferences.getTheme();
        switch (currentTheme) {
            case ThemeManager.THEME_DARK:
                themeGroup.check(R.id.theme_dark);
                break;
            case ThemeManager.THEME_LIGHT:
                themeGroup.check(R.id.theme_light);
                break;
            case ThemeManager.THEME_LEBANON:
            default:
                themeGroup.check(R.id.theme_lebanon);
                break;
        }

        themeGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                if (checkedId == R.id.theme_lebanon) {
                    preferences.setTheme(ThemeManager.THEME_LEBANON);
                } else if (checkedId == R.id.theme_dark) {
                    preferences.setTheme(ThemeManager.THEME_DARK);
                } else if (checkedId == R.id.theme_light) {
                    preferences.setTheme(ThemeManager.THEME_LIGHT);
                }
            }
        });
    }

    private void setupDictionary() {
        LinearLayout btnDictionary = findViewById(R.id.btn_dictionary);
        btnDictionary.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(SettingsActivity.this, DictionaryActivity.class);
                startActivity(intent);
            }
        });
    }

    private void setupVersion() {
        TextView tvVersion = findViewById(R.id.tv_version);
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            tvVersion.setText(getString(R.string.settings_version, pInfo.versionName));
        } catch (PackageManager.NameNotFoundException e) {
            tvVersion.setText(getString(R.string.settings_version, "1.0.0"));
        }
    }
}
