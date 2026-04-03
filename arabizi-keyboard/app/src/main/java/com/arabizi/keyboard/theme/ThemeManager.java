package com.arabizi.keyboard.theme;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;

/**
 * Manages keyboard themes including Lebanon flag theme, dark mode, and light mode.
 */
public class ThemeManager {

    public static final String THEME_LEBANON = "lebanon";
    public static final String THEME_DARK = "dark";
    public static final String THEME_LIGHT = "light";

    private static final String PREFS_NAME = "keyboard_settings";
    private static final String KEY_THEME = "selected_theme";

    private final Context context;
    private String currentTheme;

    public ThemeManager(Context context) {
        this.context = context;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.currentTheme = prefs.getString(KEY_THEME, THEME_LEBANON);
    }

    public String getCurrentTheme() {
        return currentTheme;
    }

    public void setTheme(String theme) {
        this.currentTheme = theme;
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_THEME, theme)
                .apply();
    }

    public int getKeyBackgroundColor() {
        switch (currentTheme) {
            case THEME_DARK:
                return Color.parseColor("#2D2D44");
            case THEME_LIGHT:
                return Color.parseColor("#FFFFFF");
            case THEME_LEBANON:
            default:
                return Color.parseColor("#E6FFFFFF");
        }
    }

    public int getKeyPressedColor() {
        switch (currentTheme) {
            case THEME_DARK:
                return Color.parseColor("#3D3D5C");
            case THEME_LIGHT:
                return Color.parseColor("#E0E0E0");
            case THEME_LEBANON:
            default:
                return Color.parseColor("#CCFFFFFF");
        }
    }

    public int getKeyTextColor() {
        switch (currentTheme) {
            case THEME_DARK:
                return Color.WHITE;
            case THEME_LIGHT:
                return Color.parseColor("#333333");
            case THEME_LEBANON:
            default:
                return Color.parseColor("#333333");
        }
    }

    public int getSpecialKeyBackgroundColor() {
        switch (currentTheme) {
            case THEME_DARK:
                return Color.parseColor("#ED1C24");
            case THEME_LIGHT:
                return Color.parseColor("#ED1C24");
            case THEME_LEBANON:
            default:
                return Color.parseColor("#ED1C24");
        }
    }

    public int getSpecialKeyTextColor() {
        return Color.WHITE;
    }

    public int getKeyboardBackgroundColor() {
        switch (currentTheme) {
            case THEME_DARK:
                return Color.parseColor("#1A1A2E");
            case THEME_LIGHT:
                return Color.parseColor("#F5F5F5");
            case THEME_LEBANON:
            default:
                return Color.parseColor("#F8F8F8");
        }
    }

    public int getSuggestionBarColor() {
        switch (currentTheme) {
            case THEME_DARK:
                return Color.parseColor("#16213E");
            case THEME_LIGHT:
                return Color.parseColor("#FFFFFF");
            case THEME_LEBANON:
            default:
                return Color.parseColor("#F5F5F5");
        }
    }

    public int getSuggestionTextColor() {
        switch (currentTheme) {
            case THEME_DARK:
                return Color.WHITE;
            case THEME_LIGHT:
                return Color.parseColor("#333333");
            case THEME_LEBANON:
            default:
                return Color.parseColor("#333333");
        }
    }

    public int getAccentColor() {
        return Color.parseColor("#00A651");
    }

    public int getPrimaryColor() {
        return Color.parseColor("#ED1C24");
    }

    public boolean isLebanonTheme() {
        return THEME_LEBANON.equals(currentTheme);
    }

    public boolean isDarkTheme() {
        return THEME_DARK.equals(currentTheme);
    }
}
