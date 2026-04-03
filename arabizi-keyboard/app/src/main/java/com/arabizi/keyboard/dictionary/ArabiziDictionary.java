package com.arabizi.keyboard.dictionary;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Dictionary for Arabizi words with frequency-based suggestions.
 * Includes common Lebanese dialect and general Arabic Arabizi words.
 */
public class ArabiziDictionary {

    private static final String PREFS_NAME = "arabizi_dictionary";
    private static final String KEY_USER_WORDS = "user_words";
    private static final String KEY_WORD_FREQ = "word_frequencies";

    private final Context context;
    private final Map<String, String> wordMap; // arabizi -> arabic
    private final Map<String, Integer> frequencyMap; // word -> usage count
    private final Set<String> userWords;

    // Common quick replies
    public static final String[][] QUICK_REPLIES = {
            {"shukran", "شكراً"},
            {"keefak", "كيفك"},
            {"tamam", "تمام"},
            {"ahla", "أهلا"},
            {"marhaba", "مرحبا"},
            {"yalla", "يلا"},
            {"habibi", "حبيبي"},
            {"inshallah", "إن شاء الله"},
            {"mashallah", "ماشاء الله"},
            {"wallah", "والله"},
            {"tfaddal", "تفضل"},
            {"ma3lesh", "معليش"},
            {"3afwan", "عفواً"},
            {"salam", "سلام"},
    };

    public ArabiziDictionary(Context context) {
        this.context = context;
        this.wordMap = new HashMap<>();
        this.frequencyMap = new HashMap<>();
        this.userWords = new HashSet<>();

        loadBuiltInDictionary();
        loadUserDictionary();
        loadFrequencies();
    }

    private void loadBuiltInDictionary() {
        // Greetings and common phrases
        wordMap.put("salam", "سلام");
        wordMap.put("ahla", "أهلا");
        wordMap.put("marhaba", "مرحبا");
        wordMap.put("sabah el kheir", "صباح الخير");
        wordMap.put("saba7", "صباح");
        wordMap.put("masa", "مساء");
        wordMap.put("masa2", "مساء");
        wordMap.put("keefak", "كيفك");
        wordMap.put("kifak", "كيفك");
        wordMap.put("keef", "كيف");
        wordMap.put("kif", "كيف");
        wordMap.put("shu", "شو");
        wordMap.put("sho", "شو");
        wordMap.put("shoo", "شو");
        wordMap.put("wen", "وين");
        wordMap.put("wein", "وين");
        wordMap.put("lesh", "ليش");
        wordMap.put("laish", "ليش");
        wordMap.put("leish", "ليش");

        // Common words
        wordMap.put("habibi", "حبيبي");
        wordMap.put("7abibi", "حبيبي");
        wordMap.put("habibti", "حبيبتي");
        wordMap.put("7abibti", "حبيبتي");
        wordMap.put("shukran", "شكراً");
        wordMap.put("yalla", "يلا");
        wordMap.put("yalla bye", "يلا باي");
        wordMap.put("tamam", "تمام");
        wordMap.put("ma3lesh", "معليش");
        wordMap.put("inshallah", "إن شاء الله");
        wordMap.put("insha2allah", "إن شاء الله");
        wordMap.put("mashallah", "ماشاء الله");
        wordMap.put("masha2allah", "ماشاء الله");
        wordMap.put("wallah", "والله");
        wordMap.put("walla", "والله");
        wordMap.put("tfaddal", "تفضل");
        wordMap.put("3afwan", "عفواً");
        wordMap.put("akeed", "أكيد");
        wordMap.put("2akeed", "أكيد");
        wordMap.put("khalas", "خلص");
        wordMap.put("5alas", "خلص");
        wordMap.put("bas", "بس");
        wordMap.put("halla2", "هلأ");
        wordMap.put("hala2", "هلأ");
        wordMap.put("bukra", "بكرا");
        wordMap.put("bokra", "بكرا");

        // Lebanese dialect specific
        wordMap.put("chou", "شو");
        wordMap.put("fi", "في");
        wordMap.put("ma fi", "ما في");
        wordMap.put("mafi", "ما في");
        wordMap.put("hayda", "هيدا");
        wordMap.put("hayde", "هيدي");
        wordMap.put("hek", "هيك");
        wordMap.put("heik", "هيك");
        wordMap.put("ktir", "كتير");
        wordMap.put("kteer", "كتير");
        wordMap.put("mnee7", "منيح");
        wordMap.put("mni7", "منيح");
        wordMap.put("3anjad", "عنجد");
        wordMap.put("3an jad", "عنجد");
        wordMap.put("tab", "طيب");
        wordMap.put("tayeb", "طيب");
        wordMap.put("6ayeb", "طيب");
        wordMap.put("ma3ak", "معك");
        wordMap.put("ma3ik", "معِك");
        wordMap.put("baddak", "بدّك");
        wordMap.put("baddik", "بدّك");
        wordMap.put("baddi", "بدّي");
        wordMap.put("bala", "بلا");
        wordMap.put("eza", "إذا");
        wordMap.put("2eza", "إذا");
        wordMap.put("la2", "لأ");
        wordMap.put("eh", "إيه");
        wordMap.put("na3am", "نعم");
        wordMap.put("aywa", "أيوا");

        // Numbers and time
        wordMap.put("wa2et", "وقت");
        wordMap.put("wa2t", "وقت");
        wordMap.put("lyom", "اليوم");
        wordMap.put("elyom", "اليوم");
        wordMap.put("mberi7", "مبارح");
        wordMap.put("mbare7", "مبارح");

        // People and family
        wordMap.put("baba", "بابا");
        wordMap.put("mama", "ماما");
        wordMap.put("akh", "أخ");
        wordMap.put("2akh", "أخ");
        wordMap.put("oukht", "أخت");
        wordMap.put("2okht", "أخت");
        wordMap.put("3ammo", "عمّو");
        wordMap.put("khalo", "خالو");
        wordMap.put("5alo", "خالو");
        wordMap.put("jeddo", "جدّو");
        wordMap.put("teta", "تيتا");
        wordMap.put("sedi", "سيدي");
        wordMap.put("walad", "ولد");
        wordMap.put("benet", "بنت");
        wordMap.put("bint", "بنت");
        wordMap.put("rij2al", "رجال");
        wordMap.put("mara", "مرا");
        wordMap.put("nas", "ناس");

        // Actions / verbs
        wordMap.put("rooh", "روح");
        wordMap.put("roo7", "روح");
        wordMap.put("ta3a", "تعال");
        wordMap.put("ta3al", "تعال");
        wordMap.put("istanna", "استنا");
        wordMap.put("2istanna", "استنا");
        wordMap.put("yallah", "يلا");
        wordMap.put("kel", "كل");
        wordMap.put("kol", "كل");
        wordMap.put("naam", "نام");
        wordMap.put("e7ki", "إحكي");
        wordMap.put("2e7ki", "إحكي");
        wordMap.put("7ot", "حط");
        wordMap.put("khod", "خود");
        wordMap.put("5od", "خود");
        wordMap.put("shouf", "شوف");
        wordMap.put("shouf", "شوف");

        // Places and things
        wordMap.put("beit", "بيت");
        wordMap.put("bet", "بيت");
        wordMap.put("maktab", "مكتب");
        wordMap.put("madrase", "مدرسة");
        wordMap.put("jami3a", "جامعة");
        wordMap.put("shari3", "شارع");
        wordMap.put("siyara", "سيارة");
        wordMap.put("sayara", "سيارة");
        wordMap.put("tele", "تلفون");
        wordMap.put("telephone", "تلفون");
        wordMap.put("mobayel", "موبايل");

        // Emotions and states
        wordMap.put("mabsoot", "مبسوط");
        wordMap.put("mabsou6", "مبسوط");
        wordMap.put("za3lan", "زعلان");
        wordMap.put("ta3ban", "تعبان");
        wordMap.put("ta3bane", "تعبانة");
        wordMap.put("fir7an", "فرحان");
        wordMap.put("fer7an", "فرحان");
        wordMap.put("jaw3an", "جوعان");
        wordMap.put("3atshan", "عطشان");

        // Food
        wordMap.put("akel", "أكل");
        wordMap.put("2akel", "أكل");
        wordMap.put("khobz", "خبز");
        wordMap.put("5obz", "خبز");
        wordMap.put("may", "ماي");
        wordMap.put("mayy", "ماي");
        wordMap.put("chai", "شاي");
        wordMap.put("ahwe", "قهوة");
        wordMap.put("2ahwe", "قهوة");
        wordMap.put("lahem", "لحم");
        wordMap.put("la7em", "لحم");
        wordMap.put("samak", "سمك");
        wordMap.put("riz", "رز");

        // Religious expressions
        wordMap.put("allah", "الله");
        wordMap.put("bismillah", "بسم الله");
        wordMap.put("alhamdulillah", "الحمد لله");
        wordMap.put("al7amdulillah", "الحمد لله");
        wordMap.put("subhanallah", "سبحان الله");
        wordMap.put("sub7anallah", "سبحان الله");
        wordMap.put("astaghfirullah", "أستغفر الله");
        wordMap.put("la ilaha illa allah", "لا إله إلا الله");
        wordMap.put("allahu akbar", "الله أكبر");

        // Common phrases
        wordMap.put("shou akhbarak", "شو أخبارك");
        wordMap.put("shu akhbarak", "شو أخبارك");
        wordMap.put("alla ya3teek el 3afye", "الله يعطيك العافية");
        wordMap.put("allah y5alleek", "الله يخليك");
        wordMap.put("allah ysalmak", "الله يسلمك");
        wordMap.put("tekram", "تكرم");
        wordMap.put("la2 shukran", "لأ شكراً");
        wordMap.put("min fadlak", "من فضلك");
        wordMap.put("iza btreed", "إذا بتريد");
        wordMap.put("ma ba3ref", "ما بعرف");
        wordMap.put("maba3ref", "ما بعرف");
        wordMap.put("ba3ref", "بعرف");
        wordMap.put("mesh fahim", "مش فاهم");
        wordMap.put("mish fahim", "مش فاهم");
    }

    private void loadUserDictionary() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        Set<String> saved = prefs.getStringSet(KEY_USER_WORDS, new HashSet<>());
        for (String entry : saved) {
            String[] parts = entry.split("\\|");
            if (parts.length == 2) {
                wordMap.put(parts[0], parts[1]);
                userWords.add(parts[0]);
            }
        }
    }

    private void loadFrequencies() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String freqData = prefs.getString(KEY_WORD_FREQ, "");
        if (!freqData.isEmpty()) {
            String[] entries = freqData.split(";");
            for (String entry : entries) {
                String[] parts = entry.split(":");
                if (parts.length == 2) {
                    try {
                        frequencyMap.put(parts[0], Integer.parseInt(parts[1]));
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
    }

    private void saveFrequencies() {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Integer> entry : frequencyMap.entrySet()) {
            if (sb.length() > 0) sb.append(";");
            sb.append(entry.getKey()).append(":").append(entry.getValue());
        }
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_WORD_FREQ, sb.toString())
                .apply();
    }

    /**
     * Get suggestions for the current input.
     */
    public List<String[]> getSuggestions(String input, int maxResults) {
        if (input == null || input.isEmpty()) return Collections.emptyList();

        String lower = input.toLowerCase().trim();
        List<String[]> suggestions = new ArrayList<>();

        // Exact match
        if (wordMap.containsKey(lower)) {
            suggestions.add(new String[]{lower, wordMap.get(lower)});
        }

        // Prefix matches
        for (Map.Entry<String, String> entry : wordMap.entrySet()) {
            if (entry.getKey().startsWith(lower) && !entry.getKey().equals(lower)) {
                suggestions.add(new String[]{entry.getKey(), entry.getValue()});
            }
        }

        // Sort by frequency (most used first)
        Collections.sort(suggestions, new Comparator<String[]>() {
            @Override
            public int compare(String[] a, String[] b) {
                int freqA = frequencyMap.containsKey(a[0]) ? frequencyMap.get(a[0]) : 0;
                int freqB = frequencyMap.containsKey(b[0]) ? frequencyMap.get(b[0]) : 0;
                return freqB - freqA;
            }
        });

        return suggestions.subList(0, Math.min(suggestions.size(), maxResults));
    }

    /**
     * Record word usage for frequency ranking.
     */
    public void recordUsage(String word) {
        String lower = word.toLowerCase().trim();
        int current = frequencyMap.containsKey(lower) ? frequencyMap.get(lower) : 0;
        frequencyMap.put(lower, current + 1);
        saveFrequencies();
    }

    /**
     * Add a custom word to user dictionary.
     */
    public void addUserWord(String arabizi, String arabic) {
        wordMap.put(arabizi.toLowerCase(), arabic);
        userWords.add(arabizi.toLowerCase());
        saveUserDictionary();
    }

    /**
     * Remove a word from user dictionary.
     */
    public void removeUserWord(String arabizi) {
        String lower = arabizi.toLowerCase();
        if (userWords.contains(lower)) {
            wordMap.remove(lower);
            userWords.remove(lower);
            saveUserDictionary();
        }
    }

    /**
     * Get all user-added words.
     */
    public List<String[]> getUserWords() {
        List<String[]> words = new ArrayList<>();
        for (String key : userWords) {
            if (wordMap.containsKey(key)) {
                words.add(new String[]{key, wordMap.get(key)});
            }
        }
        return words;
    }

    /**
     * Look up the Arabic translation of an Arabizi word.
     */
    public String lookup(String arabizi) {
        return wordMap.get(arabizi.toLowerCase().trim());
    }

    private void saveUserDictionary() {
        Set<String> entries = new HashSet<>();
        for (String key : userWords) {
            if (wordMap.containsKey(key)) {
                entries.add(key + "|" + wordMap.get(key));
            }
        }
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putStringSet(KEY_USER_WORDS, entries)
                .apply();
    }
}
