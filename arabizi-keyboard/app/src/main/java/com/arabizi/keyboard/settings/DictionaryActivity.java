package com.arabizi.keyboard.settings;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.arabizi.keyboard.R;
import com.arabizi.keyboard.dictionary.ArabiziDictionary;

import java.util.ArrayList;
import java.util.List;

/**
 * Activity for managing the user's personal dictionary.
 * Allows adding and removing custom Arabizi-Arabic word pairs.
 */
public class DictionaryActivity extends AppCompatActivity {

    private ArabiziDictionary dictionary;
    private RecyclerView rvWords;
    private TextView tvEmpty;
    private WordAdapter adapter;
    private List<String[]> words;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dictionary);

        dictionary = new ArabiziDictionary(this);

        // Back button
        ImageView btnBack = findViewById(R.id.btn_back);
        btnBack.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        // Add word button
        ImageView btnAdd = findViewById(R.id.btn_add_word);
        btnAdd.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showAddWordDialog();
            }
        });

        rvWords = findViewById(R.id.rv_words);
        tvEmpty = findViewById(R.id.tv_empty);

        words = new ArrayList<>(dictionary.getUserWords());
        adapter = new WordAdapter();

        rvWords.setLayoutManager(new LinearLayoutManager(this));
        rvWords.setAdapter(adapter);

        updateEmptyState();
    }

    private void showAddWordDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(getString(R.string.dictionary_add_word));

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(dpToPx(24), dpToPx(16), dpToPx(24), dpToPx(8));

        EditText etArabizi = new EditText(this);
        etArabizi.setHint("Arabizi (e.g., 7abibi)");
        etArabizi.setTextSize(16);
        layout.addView(etArabizi);

        EditText etArabic = new EditText(this);
        etArabic.setHint("عربي (مثال: حبيبي)");
        etArabic.setTextSize(16);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        params.topMargin = dpToPx(8);
        etArabic.setLayoutParams(params);
        layout.addView(etArabic);

        builder.setView(layout);

        builder.setPositiveButton(getString(R.string.dictionary_add_word),
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        String arabizi = etArabizi.getText().toString().trim();
                        String arabic = etArabic.getText().toString().trim();

                        if (!arabizi.isEmpty() && !arabic.isEmpty()) {
                            dictionary.addUserWord(arabizi, arabic);
                            words.add(new String[]{arabizi, arabic});
                            adapter.notifyItemInserted(words.size() - 1);
                            updateEmptyState();
                            Toast.makeText(DictionaryActivity.this,
                                    getString(R.string.dictionary_added),
                                    Toast.LENGTH_SHORT).show();
                        }
                    }
                });

        builder.setNegativeButton(getString(R.string.setup_skip),
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.cancel();
                    }
                });

        builder.show();
    }

    private void updateEmptyState() {
        if (words.isEmpty()) {
            rvWords.setVisibility(View.GONE);
            tvEmpty.setVisibility(View.VISIBLE);
        } else {
            rvWords.setVisibility(View.VISIBLE);
            tvEmpty.setVisibility(View.GONE);
        }
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    // RecyclerView Adapter
    private class WordAdapter extends RecyclerView.Adapter<WordAdapter.WordViewHolder> {

        @NonNull
        @Override
        public WordViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            LinearLayout layout = new LinearLayout(parent.getContext());
            layout.setOrientation(LinearLayout.HORIZONTAL);
            layout.setGravity(android.view.Gravity.CENTER_VERTICAL);
            layout.setPadding(dpToPx(16), dpToPx(12), dpToPx(16), dpToPx(12));
            layout.setLayoutParams(new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT));

            // Arabizi text
            TextView tvArabizi = new TextView(parent.getContext());
            tvArabizi.setId(android.R.id.text1);
            tvArabizi.setTextSize(16);
            tvArabizi.setTextColor(getResources().getColor(R.color.setup_text_primary));
            LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                    0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            tvArabizi.setLayoutParams(textParams);
            layout.addView(tvArabizi);

            // Arabic text
            TextView tvArabic = new TextView(parent.getContext());
            tvArabic.setId(android.R.id.text2);
            tvArabic.setTextSize(16);
            tvArabic.setTextColor(getResources().getColor(R.color.accent));
            tvArabic.setLayoutParams(textParams);
            layout.addView(tvArabic);

            // Delete button
            TextView btnDelete = new TextView(parent.getContext());
            btnDelete.setId(android.R.id.button1);
            btnDelete.setText(getString(R.string.dictionary_delete_word));
            btnDelete.setTextSize(14);
            btnDelete.setTextColor(getResources().getColor(R.color.lebanon_red));
            btnDelete.setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4));
            layout.addView(btnDelete);

            return new WordViewHolder(layout);
        }

        @Override
        public void onBindViewHolder(@NonNull WordViewHolder holder, int position) {
            String[] word = words.get(position);
            holder.tvArabizi.setText(word[0]);
            holder.tvArabic.setText(word[1]);
            holder.btnDelete.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    int pos = holder.getAdapterPosition();
                    if (pos != RecyclerView.NO_POSITION) {
                        dictionary.removeUserWord(words.get(pos)[0]);
                        words.remove(pos);
                        notifyItemRemoved(pos);
                        updateEmptyState();
                        Toast.makeText(DictionaryActivity.this,
                                getString(R.string.dictionary_deleted),
                                Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @Override
        public int getItemCount() {
            return words.size();
        }

        class WordViewHolder extends RecyclerView.ViewHolder {
            TextView tvArabizi;
            TextView tvArabic;
            TextView btnDelete;

            WordViewHolder(View itemView) {
                super(itemView);
                tvArabizi = itemView.findViewById(android.R.id.text1);
                tvArabic = itemView.findViewById(android.R.id.text2);
                btnDelete = itemView.findViewById(android.R.id.button1);
            }
        }
    }
}
