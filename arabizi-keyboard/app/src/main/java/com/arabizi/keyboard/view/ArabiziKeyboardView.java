package com.arabizi.keyboard.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.arabizi.keyboard.R;
import com.arabizi.keyboard.dictionary.ArabiziDictionary;
import com.arabizi.keyboard.theme.ThemeManager;
import com.arabizi.keyboard.transliteration.ArabiziTransliterator;
import com.arabizi.keyboard.utils.KeyboardPreferences;

import java.util.List;

/**
 * Custom keyboard view that renders keys with the Lebanese flag theme.
 * Handles touch events, suggestions, and conversion buttons.
 */
public class ArabiziKeyboardView extends LinearLayout {

    // Keyboard layouts
    private static final String[][] QWERTY_ROWS = {
            {"q", "w", "e", "r", "t", "y", "u", "i", "o", "p"},
            {"a", "s", "d", "f", "g", "h", "j", "k", "l"},
            {"SHIFT", "z", "x", "c", "v", "b", "n", "m", "DEL"},
            {"123", "LANG", "SPACE", "CONVERT", "ENTER"}
    };

    private static final String[][] NUMBERS_ROWS = {
            {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0"},
            {"@", "#", "$", "%", "&", "-", "+", "(", ")"},
            {"SYM", "!", "\"", "'", ":", ";", "/", "?", "DEL"},
            {"ABC", "LANG", "SPACE", ".", "ENTER"}
    };

    private static final String[][] SYMBOLS_ROWS = {
            {"~", "`", "|", "\\", "{", "}", "[", "]", "^", "_"},
            {"<", ">", "=", "*", "€", "£", "¥", "₩", "₹"},
            {"123", "©", "®", "™", "°", "•", "…", "¿", "DEL"},
            {"ABC", "LANG", "SPACE", ",", "ENTER"}
    };

    // State
    private boolean isShifted = false;
    private boolean isCapsLock = false;
    private int currentLayout = 0; // 0=qwerty, 1=numbers, 2=symbols
    private String currentWord = "";

    // Components
    private KeyboardActionListener listener;
    private ThemeManager themeManager;
    private KeyboardPreferences preferences;
    private ArabiziDictionary dictionary;
    private LinearLayout suggestionsContainer;
    private TextView convertButton;
    private TextView translationPreview;
    private LinearLayout rowsContainer;
    private boolean convertToArabic = true;

    public interface KeyboardActionListener {
        void onKeyPressed(String key);
        void onSpecialKeyPressed(String action);
        void onSuggestionSelected(String arabizi, String arabic);
        void onConvertPressed();
    }

    public ArabiziKeyboardView(Context context) {
        super(context);
        init(context);
    }

    public ArabiziKeyboardView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    private void init(Context context) {
        setOrientation(VERTICAL);
        themeManager = new ThemeManager(context);
        preferences = new KeyboardPreferences(context);
        dictionary = new ArabiziDictionary(context);

        // Build keyboard UI
        buildKeyboardUI();
    }

    public void setKeyboardActionListener(KeyboardActionListener listener) {
        this.listener = listener;
    }

    private void buildKeyboardUI() {
        removeAllViews();
        Context ctx = getContext();

        // Apply background based on theme
        if (themeManager.isLebanonTheme()) {
            setBackgroundResource(R.drawable.bg_keyboard_lebanon);
        } else {
            setBackgroundColor(themeManager.getKeyboardBackgroundColor());
        }

        // Suggestion bar
        LinearLayout suggestionBar = new LinearLayout(ctx);
        suggestionBar.setOrientation(HORIZONTAL);
        suggestionBar.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams sbParams = new LinearLayout.LayoutParams(
                LayoutParams.MATCH_PARENT, dpToPx(40));
        suggestionBar.setLayoutParams(sbParams);
        suggestionBar.setBackgroundColor(themeManager.getSuggestionBarColor());
        suggestionBar.setPadding(dpToPx(4), 0, dpToPx(4), 0);

        // Scrollable suggestions
        HorizontalScrollView scrollView = new HorizontalScrollView(ctx);
        scrollView.setHorizontalScrollBarEnabled(false);
        LinearLayout.LayoutParams scrollParams = new LinearLayout.LayoutParams(
                0, LayoutParams.MATCH_PARENT, 1f);
        scrollView.setLayoutParams(scrollParams);

        suggestionsContainer = new LinearLayout(ctx);
        suggestionsContainer.setOrientation(HORIZONTAL);
        suggestionsContainer.setGravity(Gravity.CENTER_VERTICAL);
        scrollView.addView(suggestionsContainer);
        suggestionBar.addView(scrollView);

        // Convert button
        convertButton = new TextView(ctx);
        convertButton.setText(convertToArabic ?
                ctx.getString(R.string.action_convert_to_arabic) :
                ctx.getString(R.string.action_convert_to_arabizi));
        convertButton.setTextSize(12);
        convertButton.setTextColor(Color.WHITE);
        convertButton.setGravity(Gravity.CENTER);
        convertButton.setPadding(dpToPx(10), dpToPx(4), dpToPx(10), dpToPx(4));

        GradientDrawable convertBg = new GradientDrawable();
        convertBg.setCornerRadius(dpToPx(16));
        convertBg.setColor(themeManager.getAccentColor());
        convertButton.setBackground(convertBg);

        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                LayoutParams.WRAP_CONTENT, dpToPx(30));
        btnParams.setMarginStart(dpToPx(4));
        convertButton.setLayoutParams(btnParams);
        convertButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (listener != null) {
                    listener.onConvertPressed();
                }
            }
        });

        if (preferences.isConversionEnabled()) {
            suggestionBar.addView(convertButton);
        }

        addView(suggestionBar);

        // Real-time translation preview bar
        if (preferences.isTranslationEnabled()) {
            translationPreview = new TextView(ctx);
            translationPreview.setTextSize(16);
            translationPreview.setTextColor(themeManager.getSuggestionTextColor());
            translationPreview.setGravity(Gravity.CENTER);
            translationPreview.setVisibility(View.GONE);
            LinearLayout.LayoutParams tpParams = new LinearLayout.LayoutParams(
                    LayoutParams.MATCH_PARENT, dpToPx(32));
            translationPreview.setLayoutParams(tpParams);
            translationPreview.setBackgroundColor(themeManager.getTranslationBarColor());
            translationPreview.setPadding(dpToPx(8), dpToPx(2), dpToPx(8), dpToPx(2));
            translationPreview.setTypeface(Typeface.DEFAULT_BOLD);
            addView(translationPreview);
        }

        // Keyboard rows
        rowsContainer = new LinearLayout(ctx);
        rowsContainer.setOrientation(VERTICAL);
        rowsContainer.setPadding(dpToPx(3), dpToPx(4), dpToPx(3), dpToPx(4));
        addView(rowsContainer);

        renderKeys();
    }

    private void renderKeys() {
        rowsContainer.removeAllViews();
        Context ctx = getContext();

        String[][] layout;
        switch (currentLayout) {
            case 1:
                layout = NUMBERS_ROWS;
                break;
            case 2:
                layout = SYMBOLS_ROWS;
                break;
            default:
                layout = QWERTY_ROWS;
                break;
        }

        for (String[] row : layout) {
            LinearLayout rowLayout = new LinearLayout(ctx);
            rowLayout.setOrientation(HORIZONTAL);
            rowLayout.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                    LayoutParams.MATCH_PARENT, dpToPx(48));
            rowParams.bottomMargin = dpToPx(4);
            rowLayout.setLayoutParams(rowParams);

            for (String key : row) {
                View keyView = createKeyView(ctx, key);
                rowLayout.addView(keyView);
            }

            rowsContainer.addView(rowLayout);
        }
    }

    private View createKeyView(Context ctx, String key) {
        TextView keyView = new TextView(ctx);
        keyView.setGravity(Gravity.CENTER);

        boolean isSpecial = isSpecialKey(key);
        float weight = getKeyWeight(key);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                0, LayoutParams.MATCH_PARENT, weight);
        params.setMargins(dpToPx(2), 0, dpToPx(2), 0);
        keyView.setLayoutParams(params);

        // Style based on key type
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dpToPx(8));

        if (isSpecial) {
            bg.setColor(themeManager.getSpecialKeyBackgroundColor());
            keyView.setTextColor(themeManager.getSpecialKeyTextColor());
            keyView.setTextSize(14);
        } else {
            bg.setColor(themeManager.getKeyBackgroundColor());
            keyView.setTextColor(themeManager.getKeyTextColor());
            keyView.setTextSize(18);
        }

        bg.setStroke(dpToPx(1), Color.parseColor("#1A000000"));
        keyView.setBackground(bg);

        // Set key label
        String label = getKeyLabel(key);
        keyView.setText(label);
        keyView.setTypeface(Typeface.DEFAULT_BOLD);

        // Touch handling
        keyView.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                handleKeyPress(key);
            }
        });

        keyView.setOnTouchListener(new OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                GradientDrawable touchBg = new GradientDrawable();
                touchBg.setCornerRadius(dpToPx(8));
                touchBg.setStroke(dpToPx(1), Color.parseColor("#1A000000"));

                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        if (isSpecial) {
                            touchBg.setColor(Color.parseColor("#AA0000"));
                        } else {
                            touchBg.setColor(themeManager.getKeyPressedColor());
                        }
                        v.setBackground(touchBg);
                        v.setScaleX(0.95f);
                        v.setScaleY(0.95f);
                        break;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        if (isSpecial) {
                            touchBg.setColor(themeManager.getSpecialKeyBackgroundColor());
                        } else {
                            touchBg.setColor(themeManager.getKeyBackgroundColor());
                        }
                        v.setBackground(touchBg);
                        v.setScaleX(1.0f);
                        v.setScaleY(1.0f);
                        break;
                }
                return false;
            }
        });

        return keyView;
    }

    private String getKeyLabel(String key) {
        switch (key) {
            case "SHIFT":
                return isShifted ? "\u21E7" : "\u2B06";
            case "DEL":
                return "\u232B";
            case "ENTER":
                return "\u21B5";
            case "SPACE":
                return " ";
            case "LANG":
                return "\uD83C\uDF10";
            case "CONVERT":
                return convertToArabic ? "\u0639" : "A";
            case "123":
                return "123";
            case "ABC":
                return "ABC";
            case "SYM":
                return "#+=";
            default:
                if (currentLayout == 0 && isShifted) {
                    return key.toUpperCase();
                }
                return key;
        }
    }

    private boolean isSpecialKey(String key) {
        return key.equals("SHIFT") || key.equals("DEL") || key.equals("ENTER")
                || key.equals("123") || key.equals("ABC") || key.equals("SYM")
                || key.equals("CONVERT");
    }

    private float getKeyWeight(String key) {
        switch (key) {
            case "SPACE":
                return 4f;
            case "SHIFT":
            case "DEL":
                return 1.5f;
            case "ENTER":
                return 1.5f;
            case "CONVERT":
                return 1.5f;
            default:
                return 1f;
        }
    }

    private void handleKeyPress(String key) {
        switch (key) {
            case "SHIFT":
                handleShift();
                break;
            case "DEL":
                if (currentWord.length() > 0) {
                    currentWord = currentWord.substring(0, currentWord.length() - 1);
                }
                if (listener != null) listener.onSpecialKeyPressed("DEL");
                updateSuggestions();
                break;
            case "ENTER":
                currentWord = "";
                if (listener != null) listener.onSpecialKeyPressed("ENTER");
                updateSuggestions();
                break;
            case "SPACE":
                if (!currentWord.isEmpty() && preferences.isAutoConvertEnabled()) {
                    String arabic = dictionary.lookup(currentWord);
                    if (arabic != null) {
                        if (listener != null) {
                            listener.onSuggestionSelected(currentWord, arabic);
                        }
                        currentWord = "";
                        updateSuggestions();
                        return;
                    }
                }
                if (!currentWord.isEmpty()) {
                    dictionary.recordUsage(currentWord);
                }
                currentWord = "";
                if (listener != null) listener.onSpecialKeyPressed("SPACE");
                updateSuggestions();
                break;
            case "123":
                currentLayout = 1;
                renderKeys();
                break;
            case "ABC":
                currentLayout = 0;
                renderKeys();
                break;
            case "SYM":
                currentLayout = 2;
                renderKeys();
                break;
            case "LANG":
                if (listener != null) listener.onSpecialKeyPressed("LANG");
                break;
            case "CONVERT":
                if (listener != null) listener.onConvertPressed();
                break;
            default:
                String charToInsert = key;
                if (currentLayout == 0 && isShifted && !isCapsLock) {
                    charToInsert = key.toUpperCase();
                    isShifted = false;
                    renderKeys();
                } else if (currentLayout == 0 && isShifted) {
                    charToInsert = key.toUpperCase();
                }
                currentWord += charToInsert.toLowerCase();
                if (listener != null) listener.onKeyPressed(charToInsert);
                updateSuggestions();
                break;
        }
    }

    private void handleShift() {
        if (!isShifted) {
            isShifted = true;
            isCapsLock = false;
        } else if (!isCapsLock) {
            isCapsLock = true;
        } else {
            isShifted = false;
            isCapsLock = false;
        }
        renderKeys();
    }

    public void updateSuggestions() {
        if (suggestionsContainer == null) return;
        suggestionsContainer.removeAllViews();

        // Update real-time translation preview
        updateTranslationPreview();

        if (!preferences.isSuggestionsEnabled() || currentWord.isEmpty()) return;

        Context ctx = getContext();
        List<String[]> suggestions = dictionary.getSuggestions(currentWord, 5);

        for (String[] suggestion : suggestions) {
            TextView tv = new TextView(ctx);
            tv.setText(suggestion[0] + " " + suggestion[1]);
            tv.setTextSize(14);
            tv.setTextColor(themeManager.getSuggestionTextColor());
            tv.setGravity(Gravity.CENTER);
            tv.setPadding(dpToPx(12), dpToPx(4), dpToPx(12), dpToPx(4));
            tv.setBackgroundResource(R.drawable.bg_suggestion_item);

            final String arabizi = suggestion[0];
            final String arabic = suggestion[1];
            tv.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {
                    if (listener != null) {
                        listener.onSuggestionSelected(arabizi, arabic);
                    }
                    dictionary.recordUsage(arabizi);
                    currentWord = "";
                    updateSuggestions();
                }
            });

            suggestionsContainer.addView(tv);

            // Divider
            View divider = new View(ctx);
            divider.setBackgroundColor(Color.parseColor("#E0E0E0"));
            LinearLayout.LayoutParams divParams = new LinearLayout.LayoutParams(
                    dpToPx(1), dpToPx(20));
            divider.setLayoutParams(divParams);
            suggestionsContainer.addView(divider);
        }
    }

    private void updateTranslationPreview() {
        if (translationPreview == null) return;

        if (currentWord.isEmpty()) {
            translationPreview.setVisibility(View.GONE);
            return;
        }

        String arabic = ArabiziTransliterator.toArabic(currentWord);
        if (!arabic.isEmpty()) {
            translationPreview.setText(currentWord + "  \u2192  " + arabic);
            translationPreview.setVisibility(View.VISIBLE);
        } else {
            translationPreview.setVisibility(View.GONE);
        }
    }

    public void setConvertMode(boolean toArabic) {
        this.convertToArabic = toArabic;
        if (convertButton != null) {
            convertButton.setText(toArabic ?
                    getContext().getString(R.string.action_convert_to_arabic) :
                    getContext().getString(R.string.action_convert_to_arabizi));
        }
    }

    public void resetCurrentWord() {
        currentWord = "";
        updateSuggestions();
    }

    public void refreshTheme() {
        themeManager = new ThemeManager(getContext());
        dictionary = new ArabiziDictionary(getContext());
        buildKeyboardUI();
    }

    private int dpToPx(int dp) {
        return (int) (dp * getContext().getResources().getDisplayMetrics().density);
    }
}
