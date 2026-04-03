package com.arabizi.keyboard.transliteration;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * Comprehensive Arabizi <-> Arabic transliteration engine.
 * Handles conversion between Latin-based Arabic (Arabizi/Franco-Arab)
 * and standard Arabic script.
 */
public class ArabiziTransliterator {

    // Arabizi to Arabic mappings (ordered by priority - longer patterns first)
    private static final LinkedHashMap<String, String> ARABIZI_TO_ARABIC = new LinkedHashMap<>();
    private static final LinkedHashMap<String, String> ARABIC_TO_ARABIZI = new LinkedHashMap<>();

    static {
        // Multi-character mappings (must come first for greedy matching)
        ARABIZI_TO_ARABIC.put("sh", "\u0634");    // ش
        ARABIZI_TO_ARABIC.put("ch", "\u0634");    // ش (alternative)
        ARABIZI_TO_ARABIC.put("kh", "\u062E");    // خ
        ARABIZI_TO_ARABIC.put("gh", "\u063A");    // غ
        ARABIZI_TO_ARABIC.put("th", "\u062B");    // ث
        ARABIZI_TO_ARABIC.put("dh", "\u0630");    // ذ
        ARABIZI_TO_ARABIC.put("ph", "\u0641");    // ف (alternative)
        ARABIZI_TO_ARABIC.put("ou", "\u0648");    // و
        ARABIZI_TO_ARABIC.put("oo", "\u0648");    // و
        ARABIZI_TO_ARABIC.put("ee", "\u064A");    // ي
        ARABIZI_TO_ARABIC.put("aa", "\u0627");    // ا (long a)
        ARABIZI_TO_ARABIC.put("ii", "\u064A");    // ي (long i)
        ARABIZI_TO_ARABIC.put("uu", "\u0648");    // و (long u)

        // Number-based mappings (Arabizi standard)
        ARABIZI_TO_ARABIC.put("2", "\u0621");     // ء (hamza)
        ARABIZI_TO_ARABIC.put("3'", "\u063A");    // غ
        ARABIZI_TO_ARABIC.put("3", "\u0639");     // ع
        ARABIZI_TO_ARABIC.put("5", "\u062E");     // خ
        ARABIZI_TO_ARABIC.put("6", "\u0637");     // ط
        ARABIZI_TO_ARABIC.put("7'", "\u062E");    // خ (alternative)
        ARABIZI_TO_ARABIC.put("7", "\u062D");     // ح
        ARABIZI_TO_ARABIC.put("8", "\u0642");     // ق
        ARABIZI_TO_ARABIC.put("9'", "\u0636");    // ض
        ARABIZI_TO_ARABIC.put("9", "\u0635");     // ص

        // Single character mappings
        ARABIZI_TO_ARABIC.put("a", "\u0627");     // ا
        ARABIZI_TO_ARABIC.put("b", "\u0628");     // ب
        ARABIZI_TO_ARABIC.put("t", "\u062A");     // ت
        ARABIZI_TO_ARABIC.put("j", "\u062C");     // ج
        ARABIZI_TO_ARABIC.put("d", "\u062F");     // د
        ARABIZI_TO_ARABIC.put("r", "\u0631");     // ر
        ARABIZI_TO_ARABIC.put("z", "\u0632");     // ز
        ARABIZI_TO_ARABIC.put("s", "\u0633");     // س
        ARABIZI_TO_ARABIC.put("f", "\u0641");     // ف
        ARABIZI_TO_ARABIC.put("q", "\u0642");     // ق
        ARABIZI_TO_ARABIC.put("k", "\u0643");     // ك
        ARABIZI_TO_ARABIC.put("l", "\u0644");     // ل
        ARABIZI_TO_ARABIC.put("m", "\u0645");     // م
        ARABIZI_TO_ARABIC.put("n", "\u0646");     // ن
        ARABIZI_TO_ARABIC.put("h", "\u0647");     // ه
        ARABIZI_TO_ARABIC.put("w", "\u0648");     // و
        ARABIZI_TO_ARABIC.put("y", "\u064A");     // ي
        ARABIZI_TO_ARABIC.put("i", "\u064A");     // ي
        ARABIZI_TO_ARABIC.put("o", "\u0648");     // و
        ARABIZI_TO_ARABIC.put("u", "\u0648");     // و
        ARABIZI_TO_ARABIC.put("e", "\u064A");     // ي
        ARABIZI_TO_ARABIC.put("p", "\u0628");     // ب
        ARABIZI_TO_ARABIC.put("v", "\u0641");     // ف
        ARABIZI_TO_ARABIC.put("g", "\u062C");     // ج
        ARABIZI_TO_ARABIC.put("x", "\u0643\u0633"); // كس
        ARABIZI_TO_ARABIC.put("c", "\u0643");     // ك

        // Arabic to Arabizi (reverse mappings)
        ARABIC_TO_ARABIZI.put("\u0621", "2");     // ء
        ARABIC_TO_ARABIZI.put("\u0623", "2");     // أ
        ARABIC_TO_ARABIZI.put("\u0625", "2");     // إ
        ARABIC_TO_ARABIZI.put("\u0622", "2a");    // آ
        ARABIC_TO_ARABIZI.put("\u0627", "a");     // ا
        ARABIC_TO_ARABIZI.put("\u0628", "b");     // ب
        ARABIC_TO_ARABIZI.put("\u062A", "t");     // ت
        ARABIC_TO_ARABIZI.put("\u062B", "th");    // ث
        ARABIC_TO_ARABIZI.put("\u062C", "j");     // ج
        ARABIC_TO_ARABIZI.put("\u062D", "7");     // ح
        ARABIC_TO_ARABIZI.put("\u062E", "kh");    // خ
        ARABIC_TO_ARABIZI.put("\u062F", "d");     // د
        ARABIC_TO_ARABIZI.put("\u0630", "dh");    // ذ
        ARABIC_TO_ARABIZI.put("\u0631", "r");     // ر
        ARABIC_TO_ARABIZI.put("\u0632", "z");     // ز
        ARABIC_TO_ARABIZI.put("\u0633", "s");     // س
        ARABIC_TO_ARABIZI.put("\u0634", "sh");    // ش
        ARABIC_TO_ARABIZI.put("\u0635", "9");     // ص
        ARABIC_TO_ARABIZI.put("\u0636", "9'");    // ض
        ARABIC_TO_ARABIZI.put("\u0637", "6");     // ط
        ARABIC_TO_ARABIZI.put("\u0638", "6'");    // ظ
        ARABIC_TO_ARABIZI.put("\u0639", "3");     // ع
        ARABIC_TO_ARABIZI.put("\u063A", "gh");    // غ
        ARABIC_TO_ARABIZI.put("\u0641", "f");     // ف
        ARABIC_TO_ARABIZI.put("\u0642", "q");     // ق
        ARABIC_TO_ARABIZI.put("\u0643", "k");     // ك
        ARABIC_TO_ARABIZI.put("\u0644", "l");     // ل
        ARABIC_TO_ARABIZI.put("\u0645", "m");     // م
        ARABIC_TO_ARABIZI.put("\u0646", "n");     // ن
        ARABIC_TO_ARABIZI.put("\u0647", "h");     // ه
        ARABIC_TO_ARABIZI.put("\u0648", "w");     // و
        ARABIC_TO_ARABIZI.put("\u064A", "y");     // ي
        ARABIC_TO_ARABIZI.put("\u0629", "a");     // ة (taa marbuta)
        ARABIC_TO_ARABIZI.put("\u0649", "a");     // ى (alef maqsura)

        // Diacritics (tashkeel) - ignored in conversion
        ARABIC_TO_ARABIZI.put("\u064E", "a");     // فتحة
        ARABIC_TO_ARABIZI.put("\u064F", "o");     // ضمة
        ARABIC_TO_ARABIZI.put("\u0650", "i");     // كسرة
        ARABIC_TO_ARABIZI.put("\u0651", "");      // شدة
        ARABIC_TO_ARABIZI.put("\u0652", "");      // سكون
    }

    /**
     * Convert Arabizi text to Arabic script.
     */
    public static String toArabic(String arabizi) {
        if (arabizi == null || arabizi.isEmpty()) return "";

        StringBuilder result = new StringBuilder();
        String lower = arabizi.toLowerCase();
        int i = 0;

        while (i < lower.length()) {
            boolean matched = false;

            // Try multi-character matches first (up to 3 chars)
            for (int len = Math.min(3, lower.length() - i); len >= 1; len--) {
                String sub = lower.substring(i, i + len);
                if (ARABIZI_TO_ARABIC.containsKey(sub)) {
                    result.append(ARABIZI_TO_ARABIC.get(sub));
                    i += len;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                char c = lower.charAt(i);
                if (c == ' ' || c == '\n' || c == '\t') {
                    result.append(c);
                } else if (Character.isDigit(c)) {
                    result.append(c);
                } else if (isPunctuation(c)) {
                    result.append(c);
                } else {
                    result.append(c);
                }
                i++;
            }
        }

        return result.toString();
    }

    /**
     * Convert Arabic script to Arabizi.
     */
    public static String toArabizi(String arabic) {
        if (arabic == null || arabic.isEmpty()) return "";

        StringBuilder result = new StringBuilder();

        for (int i = 0; i < arabic.length(); i++) {
            String ch = String.valueOf(arabic.charAt(i));

            // Handle لا (lam-alef) combination
            if (i + 1 < arabic.length()) {
                String twoChar = arabic.substring(i, i + 2);
                if (twoChar.equals("\u0644\u0627")) { // لا
                    result.append("la");
                    i++;
                    continue;
                }
                if (twoChar.equals("\u0644\u0623")) { // لأ
                    result.append("la2");
                    i++;
                    continue;
                }
                if (twoChar.equals("\u0644\u0625")) { // لإ
                    result.append("le2");
                    i++;
                    continue;
                }
            }

            if (ARABIC_TO_ARABIZI.containsKey(ch)) {
                result.append(ARABIC_TO_ARABIZI.get(ch));
            } else if (ch.charAt(0) == ' ' || ch.charAt(0) == '\n' || ch.charAt(0) == '\t') {
                result.append(ch);
            } else if (isPunctuation(ch.charAt(0))) {
                result.append(ch);
            } else if (ch.equals("\u060C")) { // Arabic comma
                result.append(",");
            } else if (ch.equals("\u061B")) { // Arabic semicolon
                result.append(";");
            } else if (ch.equals("\u061F")) { // Arabic question mark
                result.append("?");
            } else {
                result.append(ch);
            }
        }

        return result.toString();
    }

    /**
     * Detect if text is primarily Arabic script.
     */
    public static boolean isArabic(String text) {
        if (text == null || text.isEmpty()) return false;

        int arabicCount = 0;
        int totalLetters = 0;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (Character.isLetter(c)) {
                totalLetters++;
                if (Character.UnicodeBlock.of(c) == Character.UnicodeBlock.ARABIC) {
                    arabicCount++;
                }
            }
        }

        return totalLetters > 0 && (arabicCount * 100 / totalLetters) > 50;
    }

    /**
     * Detect if text contains Arabizi patterns (Latin with Arabic number substitutions).
     */
    public static boolean isArabizi(String text) {
        if (text == null || text.isEmpty()) return false;

        // Check for characteristic Arabizi number patterns
        Pattern arabiziPattern = Pattern.compile("[a-zA-Z]*[2357689][a-zA-Z]*");
        Matcher matcher = arabiziPattern.matcher(text);
        return matcher.find();
    }

    /**
     * Smart convert: auto-detect direction and convert.
     */
    public static String smartConvert(String text) {
        if (isArabic(text)) {
            return toArabizi(text);
        } else {
            return toArabic(text);
        }
    }

    private static boolean isPunctuation(char c) {
        return c == '.' || c == ',' || c == '!' || c == '?' || c == ';'
                || c == ':' || c == '-' || c == '(' || c == ')' || c == '\''
                || c == '"' || c == '/' || c == '@' || c == '#' || c == '$'
                || c == '%' || c == '&' || c == '*' || c == '+' || c == '=';
    }
}
