package com.arabizi.keyboard.utils;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Centralized preferences manager for keyboard settings.
 * All settings persist across app restarts using SharedPreferences.
 */
public class KeyboardPreferences {

    private static final String PREFS_NAME = "keyboard_settings";

    // Setting keys
    private static final String KEY_AUTOCORRECT = "autocorrect_enabled";
    private static final String KEY_SUGGESTIONS = "suggestions_enabled";
    private static final String KEY_AUTO_CONVERT = "auto_convert_enabled";
    private static final String KEY_TRANSLATION = "translation_enabled";
    private static final String KEY_VIBRATION = "vibration_enabled";
    private static final String KEY_SOUND = "sound_enabled";
    private static final String KEY_THEME = "selected_theme";
    private static final String KEY_SETUP_COMPLETE = "setup_complete";
    private static final String KEY_ARABIZI_ENABLED = "arabizi_enabled";
    private static final String KEY_ARABIC_ENABLED = "arabic_enabled";
    private static final String KEY_ENGLISH_ENABLED = "english_enabled";
    private static final String KEY_CONVERSION_ENABLED = "conversion_enabled";

    private final SharedPreferences prefs;

    public KeyboardPreferences(Context context) {
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    // Autocorrect
    public boolean isAutocorrectEnabled() {
        return prefs.getBoolean(KEY_AUTOCORRECT, true);
    }

    public void setAutocorrectEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_AUTOCORRECT, enabled).apply();
    }

    // Suggestions
    public boolean isSuggestionsEnabled() {
        return prefs.getBoolean(KEY_SUGGESTIONS, true);
    }

    public void setSuggestionsEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_SUGGESTIONS, enabled).apply();
    }

    // Auto Convert (Arabizi -> Arabic while typing)
    public boolean isAutoConvertEnabled() {
        return prefs.getBoolean(KEY_AUTO_CONVERT, false);
    }

    public void setAutoConvertEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_AUTO_CONVERT, enabled).apply();
    }

    // Translation
    public boolean isTranslationEnabled() {
        return prefs.getBoolean(KEY_TRANSLATION, true);
    }

    public void setTranslationEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_TRANSLATION, enabled).apply();
    }

    // Vibration
    public boolean isVibrationEnabled() {
        return prefs.getBoolean(KEY_VIBRATION, true);
    }

    public void setVibrationEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_VIBRATION, enabled).apply();
    }

    // Sound
    public boolean isSoundEnabled() {
        return prefs.getBoolean(KEY_SOUND, false);
    }

    public void setSoundEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_SOUND, enabled).apply();
    }

    // Theme
    public String getTheme() {
        return prefs.getString(KEY_THEME, "lebanon");
    }

    public void setTheme(String theme) {
        prefs.edit().putString(KEY_THEME, theme).apply();
    }

    // Setup Complete
    public boolean isSetupComplete() {
        return prefs.getBoolean(KEY_SETUP_COMPLETE, false);
    }

    public void setSetupComplete(boolean complete) {
        prefs.edit().putBoolean(KEY_SETUP_COMPLETE, complete).apply();
    }

    // Language modes
    public boolean isArabiziEnabled() {
        return prefs.getBoolean(KEY_ARABIZI_ENABLED, true);
    }

    public void setArabiziEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_ARABIZI_ENABLED, enabled).apply();
    }

    public boolean isArabicEnabled() {
        return prefs.getBoolean(KEY_ARABIC_ENABLED, true);
    }

    public void setArabicEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_ARABIC_ENABLED, enabled).apply();
    }

    public boolean isEnglishEnabled() {
        return prefs.getBoolean(KEY_ENGLISH_ENABLED, true);
    }

    public void setEnglishEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_ENGLISH_ENABLED, enabled).apply();
    }

    public boolean isConversionEnabled() {
        return prefs.getBoolean(KEY_CONVERSION_ENABLED, true);
    }

    public void setConversionEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_CONVERSION_ENABLED, enabled).apply();
    }
}
