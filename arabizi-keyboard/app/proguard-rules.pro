# Arabizi Keyboard ProGuard Rules
-keep class com.arabizi.keyboard.** { *; }
-keepclassmembers class * extends android.inputmethodservice.InputMethodService {
    public *;
}
