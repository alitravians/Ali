package com.arabizi.keyboard.service;

import android.content.Intent;
import android.inputmethodservice.InputMethodService;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.ExtractedText;
import android.view.inputmethod.ExtractedTextRequest;
import android.view.inputmethod.InputConnection;

import com.arabizi.keyboard.dictionary.ArabiziDictionary;
import com.arabizi.keyboard.settings.SettingsActivity;
import com.arabizi.keyboard.theme.ThemeManager;
import com.arabizi.keyboard.transliteration.ArabiziTransliterator;
import com.arabizi.keyboard.utils.KeyboardPreferences;
import com.arabizi.keyboard.view.ArabiziKeyboardView;

/**
 * Main Input Method Service for Arabizi Keyboard.
 * Handles text input, suggestions, and transliteration.
 */
public class ArabiziInputMethodService extends InputMethodService
        implements ArabiziKeyboardView.KeyboardActionListener {

    private ArabiziKeyboardView keyboardView;
    private KeyboardPreferences preferences;
    private ArabiziDictionary dictionary;
    private ThemeManager themeManager;
    private boolean convertToArabic = true;
    private StringBuilder composingText = new StringBuilder();

    @Override
    public void onCreate() {
        super.onCreate();
        preferences = new KeyboardPreferences(this);
        dictionary = new ArabiziDictionary(this);
        themeManager = new ThemeManager(this);
    }

    @Override
    public View onCreateInputView() {
        keyboardView = new ArabiziKeyboardView(this);
        keyboardView.setKeyboardActionListener(this);
        return keyboardView;
    }

    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        if (keyboardView != null) {
            keyboardView.refreshTheme();
            keyboardView.resetCurrentWord();
        }
        composingText.setLength(0);
    }

    @Override
    public void onFinishInput() {
        super.onFinishInput();
        composingText.setLength(0);
    }

    // KeyboardActionListener implementations

    @Override
    public void onKeyPressed(String key) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        // Vibrate if enabled
        doVibrate();

        ic.commitText(key, 1);
        composingText.append(key);
    }

    @Override
    public void onSpecialKeyPressed(String action) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        doVibrate();

        switch (action) {
            case "DEL":
                handleDelete(ic);
                break;
            case "ENTER":
                handleEnter(ic);
                break;
            case "SPACE":
                handleSpace(ic);
                break;
            case "LANG":
                handleLanguageSwitch();
                break;
        }
    }

    @Override
    public void onSuggestionSelected(String arabizi, String arabic) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        // Delete the typed Arabizi word
        int wordLen = arabizi.length();
        if (composingText.length() >= wordLen) {
            // Delete the partial word that was typed
            for (int i = 0; i < wordLen; i++) {
                ic.deleteSurroundingText(1, 0);
            }
        } else {
            // Fallback: delete composing text length
            ic.deleteSurroundingText(composingText.length(), 0);
        }

        // Insert the Arabic word + space
        ic.commitText(arabic + " ", 1);
        composingText.setLength(0);
    }

    @Override
    public void onConvertPressed() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        // Get all text in the field
        ExtractedText extractedText = ic.getExtractedText(new ExtractedTextRequest(), 0);
        if (extractedText == null || TextUtils.isEmpty(extractedText.text)) return;

        String text = extractedText.text.toString();
        String converted;

        // Check if there's selected text
        CharSequence selectedText = ic.getSelectedText(0);
        if (selectedText != null && selectedText.length() > 0) {
            // Convert only selected text
            if (ArabiziTransliterator.isArabic(selectedText.toString())) {
                converted = ArabiziTransliterator.toArabizi(selectedText.toString());
            } else {
                converted = ArabiziTransliterator.toArabic(selectedText.toString());
            }
            ic.commitText(converted, 1);
        } else {
            // Convert all text
            if (ArabiziTransliterator.isArabic(text)) {
                converted = ArabiziTransliterator.toArabizi(text);
            } else {
                converted = ArabiziTransliterator.toArabic(text);
            }

            // Select all and replace
            ic.performContextMenuAction(android.R.id.selectAll);
            ic.commitText(converted, 1);
        }

        // Set convert mode based on what the text is NOW (after conversion)
        // If we just converted to Arabic, next conversion should be to Arabizi
        convertToArabic = !ArabiziTransliterator.isArabic(converted);
        if (keyboardView != null) {
            keyboardView.setConvertMode(convertToArabic);
        }

        composingText.setLength(0);
    }

    private void handleDelete(InputConnection ic) {
        CharSequence selectedText = ic.getSelectedText(0);
        if (selectedText != null && selectedText.length() > 0) {
            ic.commitText("", 1);
            // Clear both composingText and view's currentWord since selection disrupts tracked state
            composingText.setLength(0);
            if (keyboardView != null) {
                keyboardView.resetCurrentWord();
            }
        } else {
            ic.deleteSurroundingText(1, 0);
            if (composingText.length() > 0) {
                composingText.deleteCharAt(composingText.length() - 1);
            }
        }
    }

    private void handleEnter(InputConnection ic) {
        EditorInfo editorInfo = getCurrentInputEditorInfo();
        if (editorInfo != null) {
            int imeAction = editorInfo.imeOptions & EditorInfo.IME_MASK_ACTION;
            boolean noEnterAction = (editorInfo.imeOptions & EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0;
            if (!noEnterAction) {
                switch (imeAction) {
                    case EditorInfo.IME_ACTION_SEARCH:
                    case EditorInfo.IME_ACTION_SEND:
                    case EditorInfo.IME_ACTION_GO:
                    case EditorInfo.IME_ACTION_DONE:
                    case EditorInfo.IME_ACTION_NEXT:
                        ic.performEditorAction(imeAction);
                        composingText.setLength(0);
                        return;
                }
            }
            ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER));
            ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER));
        }
        composingText.setLength(0);
    }

    private void handleSpace(InputConnection ic) {
        ic.commitText(" ", 1);
        composingText.setLength(0);
    }

    private void handleLanguageSwitch() {
        // Cycle through available input methods
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                switchToNextInputMethod(false);
            } else {
                // Fallback for older devices
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    switchInputMethod(null);
                }
            }
        } catch (Exception e) {
            // Ignore if switching fails
        }
    }

    private void doVibrate() {
        if (!preferences.isVibrationEnabled()) return;

        try {
            Vibrator vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(20);
                }
            }
        } catch (Exception e) {
            // Ignore vibration errors
        }
    }
}
