package com.arabizi.keyboard.setup;

import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.view.LayoutInflater;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.arabizi.keyboard.R;
import com.arabizi.keyboard.settings.SettingsActivity;
import com.arabizi.keyboard.utils.KeyboardPreferences;
import com.google.android.material.button.MaterialButton;

/**
 * Setup wizard that guides users through enabling and configuring the keyboard.
 * Steps: Welcome -> Enable -> Select -> Language -> Done
 */
public class SetupWizardActivity extends AppCompatActivity {

    private static final int TOTAL_STEPS = 5;

    private int currentStep = 0;
    private KeyboardPreferences preferences;
    private FrameLayout contentFrame;
    private LinearLayout stepIndicators;
    private MaterialButton btnNext;
    private MaterialButton btnPrevious;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setup_wizard);

        preferences = new KeyboardPreferences(this);

        // If setup already complete, go to settings
        if (preferences.isSetupComplete()) {
            startActivity(new Intent(this, SettingsActivity.class));
            finish();
            return;
        }

        contentFrame = findViewById(R.id.content_frame);
        stepIndicators = findViewById(R.id.step_indicators);
        btnNext = findViewById(R.id.btn_next);
        btnPrevious = findViewById(R.id.btn_previous);

        btnNext.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (currentStep < TOTAL_STEPS - 1) {
                    currentStep++;
                    showStep(currentStep);
                } else {
                    finishSetup();
                }
            }
        });

        btnPrevious.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (currentStep > 0) {
                    currentStep--;
                    showStep(currentStep);
                }
            }
        });

        showStep(0);
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Refresh status when returning from system settings
        if (currentStep == 1) {
            showStep(1);
        }
    }

    private void showStep(int step) {
        contentFrame.removeAllViews();
        updateIndicators(step);
        updateButtons(step);

        LayoutInflater inflater = LayoutInflater.from(this);

        switch (step) {
            case 0:
                showWelcomeStep(inflater);
                break;
            case 1:
                showEnableStep(inflater);
                break;
            case 2:
                showSelectStep(inflater);
                break;
            case 3:
                showLanguageStep(inflater);
                break;
            case 4:
                showDoneStep(inflater);
                break;
        }
    }

    private void showWelcomeStep(LayoutInflater inflater) {
        View view = inflater.inflate(R.layout.setup_step_welcome, contentFrame, false);
        contentFrame.addView(view);
    }

    private void showEnableStep(LayoutInflater inflater) {
        View view = inflater.inflate(R.layout.setup_step_enable, contentFrame, false);

        MaterialButton btnEnable = view.findViewById(R.id.btn_enable_keyboard);
        TextView tvStatus = view.findViewById(R.id.tv_enable_status);

        // Check if keyboard is already enabled
        boolean isEnabled = isKeyboardEnabled();
        if (isEnabled) {
            tvStatus.setText("تم تفعيل لوحة المفاتيح بنجاح ✓");
            tvStatus.setTextColor(getResources().getColor(R.color.accent));
        } else {
            tvStatus.setText("لم يتم تفعيل لوحة المفاتيح بعد");
            tvStatus.setTextColor(getResources().getColor(R.color.lebanon_red));
        }

        btnEnable.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
                startActivity(intent);
            }
        });

        contentFrame.addView(view);
    }

    private void showSelectStep(LayoutInflater inflater) {
        View view = inflater.inflate(R.layout.setup_step_select, contentFrame, false);

        MaterialButton btnSelect = view.findViewById(R.id.btn_select_keyboard);
        btnSelect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                if (imm != null) {
                    imm.showInputMethodPicker();
                }
            }
        });

        contentFrame.addView(view);
    }

    private void showLanguageStep(LayoutInflater inflater) {
        View view = inflater.inflate(R.layout.setup_step_language, contentFrame, false);

        CheckBox cbArabizi = view.findViewById(R.id.cb_arabizi);
        CheckBox cbArabic = view.findViewById(R.id.cb_arabic);
        CheckBox cbEnglish = view.findViewById(R.id.cb_english);
        CheckBox cbConversion = view.findViewById(R.id.cb_conversion);

        // Load saved preferences
        cbArabizi.setChecked(preferences.isArabiziEnabled());
        cbArabic.setChecked(preferences.isArabicEnabled());
        cbEnglish.setChecked(preferences.isEnglishEnabled());
        cbConversion.setChecked(preferences.isConversionEnabled());

        // Save on change
        cbArabizi.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                preferences.setArabiziEnabled(isChecked);
            }
        });
        cbArabic.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                preferences.setArabicEnabled(isChecked);
            }
        });
        cbEnglish.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                preferences.setEnglishEnabled(isChecked);
            }
        });
        cbConversion.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                preferences.setConversionEnabled(isChecked);
            }
        });

        contentFrame.addView(view);
    }

    private void showDoneStep(LayoutInflater inflater) {
        View view = inflater.inflate(R.layout.setup_step_done, contentFrame, false);
        contentFrame.addView(view);
    }

    private void updateIndicators(int step) {
        stepIndicators.removeAllViews();

        for (int i = 0; i < TOTAL_STEPS; i++) {
            View dot = new View(this);
            int size = (i == step) ? dpToPx(12) : dpToPx(10);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(size, size);
            params.setMargins(dpToPx(4), 0, dpToPx(4), 0);
            dot.setLayoutParams(params);

            if (i == step) {
                dot.setBackgroundResource(R.drawable.bg_step_indicator_active);
            } else {
                dot.setBackgroundResource(R.drawable.bg_step_indicator_inactive);
            }

            stepIndicators.addView(dot);
        }

        // Step counter text (optional)
        TextView stepText = new TextView(this);
        stepText.setText(getString(R.string.setup_step, step + 1, TOTAL_STEPS));
        stepText.setTextSize(12);
        stepText.setTextColor(getResources().getColor(R.color.setup_text_secondary));
        LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        textParams.setMarginStart(dpToPx(16));
        stepText.setLayoutParams(textParams);
        stepIndicators.addView(stepText);
    }

    private void updateButtons(int step) {
        btnPrevious.setVisibility(step > 0 ? View.VISIBLE : View.GONE);

        if (step == TOTAL_STEPS - 1) {
            btnNext.setText(R.string.setup_finish);
        } else {
            btnNext.setText(R.string.setup_next);
        }
    }

    private void finishSetup() {
        preferences.setSetupComplete(true);
        startActivity(new Intent(this, SettingsActivity.class));
        finish();
    }

    private boolean isKeyboardEnabled() {
        String enabledIMEs = Settings.Secure.getString(
                getContentResolver(), Settings.Secure.ENABLED_INPUT_METHODS);
        return enabledIMEs != null && enabledIMEs.contains(getPackageName());
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }
}
