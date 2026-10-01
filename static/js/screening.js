let currentStep = 1;
let selectedImageFile = null;

const formData = {
  sex: "Female",
  occupation_intensity: "Sedentary",
  family_history: 0,
  previous_injury: 0,
  squat_difficulty: 0,
  stiffness: 0,
  crepitus: 0,
  swelling: 0,
  affected_side: 0
};




document.addEventListener("DOMContentLoaded", () => {

  initializeSegmentedControls();

  initializeSliders();

  initializeBMICalculation();

  initializeImageUpload();

  initializeNavigation();

  updateStepUI();

});




function initializeSegmentedControls() {

  const groups =
    document.querySelectorAll(".segmented");

  groups.forEach(group => {

    const field =
      group.dataset.field;

    const buttons =
      group.querySelectorAll("button");

    buttons.forEach(button => {

      button.addEventListener("click", () => {

        buttons.forEach(btn => {
          btn.classList.remove("is-selected");
        });

        button.classList.add("is-selected");

        formData[field] =
          button.dataset.value;

      });

    });

  });

}



function initializeSliders() {

  const painSlider =
    document.getElementById("pain_score");

  const painValue =
    document.getElementById("pain_score_val");


  if (painSlider && painValue) {

    painSlider.addEventListener("input", () => {

      painValue.textContent =
        painSlider.value;

    });

  }


  const gaitSlider =
    document.getElementById("gait_asymmetry");

  const gaitValue =
    document.getElementById("gait_asymmetry_val");


  if (gaitSlider && gaitValue) {

    gaitSlider.addEventListener("input", () => {

      gaitValue.textContent =
        gaitSlider.value;

    });

  }


  const mobilitySlider =
    document.getElementById("mobility_score");

  const mobilityValue =
    document.getElementById("mobility_score_val");


  if (mobilitySlider && mobilityValue) {

    mobilitySlider.addEventListener("input", () => {

      mobilityValue.textContent =
        mobilitySlider.value;

    });

  }

}



function initializeBMICalculation() {

  const heightInput =
    document.getElementById("height_cm");

  const weightInput =
    document.getElementById("weight_kg");

  const bmiInput =
    document.getElementById("bmi");


  if (!heightInput ||
      !weightInput ||
      !bmiInput) {

    return;

  }


  function calculateBMI() {

    const height =
      Number(heightInput.value);

    const weight =
      Number(weightInput.value);


    if (
      height > 0 &&
      weight > 0
    ) {

      const heightMeters =
        height / 100;

      const bmi =
        weight /
        (heightMeters * heightMeters);


      bmiInput.value =
        bmi.toFixed(1);

    }

  }


  heightInput.addEventListener(
    "input",
    calculateBMI
  );

  weightInput.addEventListener(
    "input",
    calculateBMI
  );

}




function initializeImageUpload() {

  const fileInput =
    document.getElementById("xray_image");

  const previewWrap =
    document.getElementById("xray_preview");

  const previewImg =
    document.getElementById("xray_preview_img");

  const clearBtn =
    document.getElementById("xray_clear");

  if (!fileInput) {
    return;
  }

  fileInput.addEventListener("change", () => {

    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      selectedImageFile = null;
      if (previewWrap) previewWrap.style.display = "none";
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file (JPG, PNG, etc.).");
      fileInput.value = "";
      selectedImageFile = null;
      if (previewWrap) previewWrap.style.display = "none";
      return;
    }

    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.style.display = "block";
    };
    reader.readAsDataURL(file);

  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      selectedImageFile = null;
      fileInput.value = "";
      if (previewWrap) previewWrap.style.display = "none";
    });
  }

}




function initializeNavigation() {

  const nextButton =
    document.getElementById("btn-next");

  const backButton =
    document.getElementById("btn-back");

  const resetButton =
    document.getElementById("btn-reset");


  if (nextButton) {

    nextButton.addEventListener(
      "click",
      handleNext
    );

  }


  if (backButton) {

    backButton.addEventListener(
      "click",
      handleBack
    );

  }


  if (resetButton) {

    resetButton.addEventListener(
      "click",
      () => {

        window.location.reload();

      }
    );

  }

}




async function handleNext() {

  if (!validateCurrentStep()) {
    return;
  }


  
  if (currentStep === 3) {

    currentStep = 4;

    updateStepUI();

    await runScreening();

    return;

  }



  if (currentStep < 4) {

    currentStep++;

    updateStepUI();

  }

}




function handleBack() {

  if (currentStep > 1) {

    currentStep--;

    updateStepUI();

  }

}



function validateCurrentStep() {

  

  if (currentStep === 1) {

    const patientName =
      document.getElementById(
        "patient_name"
      )?.value.trim();


    const age =
      document.getElementById(
        "age"
      )?.value;


    const bmi =
      document.getElementById(
        "bmi"
      )?.value;


    if (!patientName) {

      alert(
        "Please enter the patient's full name."
      );

      return false;

    }


    if (!age) {

      alert(
        "Please enter the patient's age."
      );

      return false;

    }


    if (!bmi) {

      alert(
        "Please enter the BMI."
      );

      return false;

    }

  }


  

  if (currentStep === 2) {

    const temperature =
      document.getElementById(
        "temperature"
      );


    if (
      temperature &&
      temperature.value
    ) {

      const temp =
        Number(temperature.value);


      if (
        temp < 30 ||
        temp > 45
      ) {

        alert(
          "Please enter a valid body temperature."
        );

        return false;

      }

    }

  }


  // --------------------------------------------------------
  // STEP 3
  // --------------------------------------------------------

  if (currentStep === 3) {

    const kneeROM =
      document.getElementById(
        "knee_rom"
      )?.value;


    const walkingSpeed =
      document.getElementById(
        "walking_speed"
      )?.value;


    const stepDuration =
      document.getElementById(
        "step_duration"
      )?.value;


    if (!kneeROM) {

      alert(
        "Please enter the knee range of motion."
      );

      return false;

    }


    if (!walkingSpeed) {

      alert(
        "Please enter the walking speed."
      );

      return false;

    }


    if (!stepDuration) {

      alert(
        "Please enter the step duration."
      );

      return false;

    }


    if (!selectedImageFile) {

      alert(
        "Please upload a knee X-ray image before running the screening."
      );

      return false;

    }

  }


  return true;

}



function updateStepUI() {

  const panels =
    document.querySelectorAll(
      ".wizard-panel"
    );


  panels.forEach(panel => {

    const step =
      Number(
        panel.dataset.panel
      );


    if (step === currentStep) {

      panel.classList.add(
        "is-active"
      );

    } else {

      panel.classList.remove(
        "is-active"
      );

    }

  });



  const stepDots =
    document.querySelectorAll(
      ".step-dot"
    );


  stepDots.forEach(dot => {

    const step =
      Number(
        dot.dataset.step
      );


    dot.classList.remove(
      "is-active"
    );

    dot.classList.remove(
      "is-complete"
    );


    if (step === currentStep) {

      dot.classList.add(
        "is-active"
      );

    }


    if (step < currentStep) {

      dot.classList.add(
        "is-complete"
      );

    }

  });



  const backButton =
    document.getElementById(
      "btn-back"
    );

  const nextButton =
    document.getElementById(
      "btn-next"
    );

  const resetButton =
    document.getElementById(
      "btn-reset"
    );


  if (backButton) {

    backButton.style.display =
      currentStep === 1
        ? "none"
        : "";

  }


  if (nextButton) {

    if (currentStep === 4) {

      nextButton.style.display =
        "none";

    } else {

      nextButton.style.display =
        "";

      nextButton.textContent =
        currentStep === 3
          ? "Run screening"
          : "Continue";

    }

  }


  if (resetButton) {

    resetButton.style.display =
      currentStep === 4
        ? ""
        : "none";

  }

}




function collectFormData() {

  const temperatureElement =
    document.getElementById(
      "temperature"
    );


  const data = {

    patient_name:
      document.getElementById(
        "patient_name"
      )?.value.trim() || "",


    age:
      Number(
        document.getElementById(
          "age"
        )?.value || 0
      ),


    sex:
      formData.sex,


    height_cm:
      Number(
        document.getElementById(
          "height_cm"
        )?.value || 0
      ),


    weight_kg:
      Number(
        document.getElementById(
          "weight_kg"
        )?.value || 0
      ),


    bmi:
      Number(
        document.getElementById(
          "bmi"
        )?.value || 0
      ),


    occupation_intensity:
      formData.occupation_intensity,


    facility:
      document.getElementById(
        "facility"
      )?.value.trim() || "",


    worker_name:
      document.getElementById(
        "worker_name"
      )?.value.trim() || "",


    family_history:
      Number(
        formData.family_history
      ),


    previous_injury:
      Number(
        formData.previous_injury
      ),


    symptom_duration_months:
      Number(
        document.getElementById(
          "symptom_duration_months"
        )?.value || 0
      ),


    squat_difficulty:
      Number(
        formData.squat_difficulty
      ),


    pain_score:
      Number(
        document.getElementById(
          "pain_score"
        )?.value || 0
      ),


    stiffness:
      Number(
        formData.stiffness
      ),


    crepitus:
      Number(
        formData.crepitus
      ),


    swelling:
      Number(
        formData.swelling
      ),


    affected_side:
      Number(
        formData.affected_side
      ),


    knee_rom:
      Number(
        document.getElementById(
          "knee_rom"
        )?.value || 0
      ),


    walking_speed:
      Number(
        document.getElementById(
          "walking_speed"
        )?.value || 0
      ),


    step_duration:
      Number(
        document.getElementById(
          "step_duration"
        )?.value || 0
      ),


    gait_asymmetry:
      Number(
        document.getElementById(
          "gait_asymmetry"
        )?.value || 0
      ),


    mobility_score:
      Number(
        document.getElementById(
          "mobility_score"
        )?.value || 0
      )

  };


  // --------------------------------------------------------
  // Temperature
  // --------------------------------------------------------
  //
  // IMPORTANT:
  // Your current Flask model does not use temperature.
  // We only collect it here if the field exists.
  //

  if (temperatureElement) {

    data.temperature =
      Number(
        temperatureElement.value || 0
      );

  }


  return data;

}



async function runScreening() {

  const loading =
    document.getElementById(
      "result-loading"
    );

  const resultContent =
    document.getElementById(
      "result-content"
    );


  if (loading) {

    loading.style.display =
      "block";

  }


  if (resultContent) {

    resultContent.style.display =
      "none";

  }


  try {

    const payload =
      collectFormData();


    console.log(
      "Sending screening data:",
      payload
    );


    const body = new FormData();

    Object.entries(payload).forEach(
      ([key, value]) => {
        body.append(key, value);
      }
    );

    if (selectedImageFile) {
      body.append("image", selectedImageFile);
    }


    // NOTE: no "Content-Type" header here on purpose —
    // the browser sets the correct multipart boundary automatically
    // when the body is a FormData object.
    const response =
      await fetch(
        "/api/screen",
        {
          method: "POST",
          body: body
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Screening failed."
      );

    }


    console.log(
      "Screening result:",
      data
    );


    displayResult(data);


  } catch (error) {

    console.error(
      "Screening error:",
      error
    );


    if (loading) {

      loading.style.display =
        "none";

    }


    if (resultContent) {

      resultContent.style.display =
        "block";


      resultContent.innerHTML = `

        <div
          style="
            padding:30px;
            border-radius:16px;
            background:#fff5f5;
            border:1px solid #f0cccc;
          "
        >

          <h3>
            Screening could not be completed
          </h3>

          <p>
            ${escapeHTML(error.message)}
          </p>

          <button
            type="button"
            class="btn btn-primary"
            onclick="runScreening()"
          >
            Try again
          </button>

        </div>

      `;

    }

  }

}




function escapeHTML(value) {

  return String(value ?? "")

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}




function displayResult(data) {

  const resultLoading =
    document.getElementById(
      "result-loading"
    );

  const resultContent =
    document.getElementById(
      "result-content"
    );


  if (!resultContent) {

    console.error(
      "result-content element not found!"
    );

    return;

  }


  if (resultLoading) {

    resultLoading.style.display =
      "none";

  }


  const risk =
    data.risk_category ||
    "Unknown";


  const confidence =
    data.confidence !== undefined
      ? Number(data.confidence)
      : 0;


  const guidance =
    data.guidance ||
    {};


  const probabilities =
    data.probabilities ||
    {};


  const riskDescriptions = {

    Normal:
      "No significant OA risk markers detected.",

    Mild:
      "Early risk markers are present. Preventive action is recommended.",

    Moderate:
      "Noticeable OA risk markers are present. Clinical review is advised.",

    Severe:
      "High risk markers are detected. Prompt referral is recommended."

  };


  const description =
    guidance.headline ||
    riskDescriptions[risk] ||
    "";


  // ========================================================================
  // PROBABILITY CARDS
  // ========================================================================

  const probabilityHTML =
    Object.entries(
      probabilities
    )

    .map(
      ([category, probability]) => {

        const percentage =
          Math.max(
            0,
            Math.min(
              100,
              Number(probability) * 100
            )
          );


        const rounded =
          percentage.toFixed(1);


        const categoryClass =
          category
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            );


        const selected =
          category === risk;


        return `

          <button
            type="button"
            class="
              interactive-probability
              ${selected ? "is-highlighted" : ""}
            "
            data-category="${escapeHTML(category)}"
            aria-expanded="${selected}"
          >

            <div class="probability-top">

              <span class="probability-name">

                <span
                  class="
                    risk-dot
                    risk-dot-${categoryClass}
                  "
                ></span>

                ${escapeHTML(category)}

              </span>

              <strong>
                ${rounded}%
              </strong>

            </div>


            <div class="probability-track">

              <span
                class="probability-fill"
                data-width="${percentage}%"
                style="width:0%"
              ></span>

            </div>


            <span class="probability-more">

              ${
                selected
                  ? "Current screening result"
                  : "Click to compare"
              }

            </span>

          </button>

        `;

      }
    )
    .join("");


  

  let adviceHTML = "";


  if (
    Array.isArray(
      guidance.advice
    )
  ) {

    adviceHTML =
      guidance.advice

        .map(
          (item, index) => {

            return `

              <button
                type="button"
                class="advice-card"
                aria-expanded="false"
              >

                <span
                  class="advice-number"
                >
                  ${index + 1}
                </span>


                <span
                  class="advice-text"
                >
                  ${escapeHTML(item)}
                </span>


                <span
                  class="advice-chevron"
                  aria-hidden="true"
                >
                  +
                </span>

              </button>

            `;

          }
        )

        .join("");

  }


  // ========================================================================
  // RESULT HTML
  // ========================================================================

  resultContent.innerHTML = `

    <style>

      /* ==================================================
         MAIN RESULT
         ================================================== */

      .interactive-result {

        animation:
          resultFadeIn
          .45s
          ease
          both;

      }


      @keyframes resultFadeIn {

        from {

          opacity:0;

          transform:
            translateY(12px);

        }

        to {

          opacity:1;

          transform:
            translateY(0);

        }

      }


      /* ==================================================
         HERO CARD
         ================================================== */

      .result-hero {

        border:
          1px solid
          rgba(18,72,61,.14);

        border-radius:
          18px;

        padding:
          24px;

        background:
          linear-gradient(
            145deg,
            #f8fbf8,
            #ffffff
          );

        box-shadow:
          0 10px 30px
          rgba(20,45,38,.07);

      }


      .result-hero-main {

        display:flex;

        align-items:center;

        justify-content:
          space-between;

        gap:24px;

      }


      .result-eyebrow {

        font-size:
          13px;

        font-weight:
          700;

        letter-spacing:
          .08em;

        text-transform:
          uppercase;

        color:
          var(--ink-soft);

        margin-bottom:
          7px;

      }


      .result-risk-big {

        margin:
          0 0 8px;

        font-size:
          34px;

        line-height:
          1;

        color:
          var(--ink);

      }


      .result-summary {

        margin:
          0;

        max-width:
          560px;

        color:
          var(--ink-soft);

        line-height:
          1.55;

      }


      /* ==================================================
         CONFIDENCE CIRCLE
         ================================================== */

      .confidence-ring {

        --confidence:
          ${Math.max(
            0,
            Math.min(
              100,
              confidence
            )
          )}%;

        width:
          112px;

        height:
          112px;

        flex:
          0 0 112px;

        border-radius:
          50%;

        display:grid;

        place-items:center;

        background:
          conic-gradient(
            var(--brand)
            var(--confidence),
            #e7ece9 0
          );

        position:
          relative;

      }


      .confidence-ring::before {

        content:"";

        position:absolute;

        inset:9px;

        border-radius:50%;

        background:#fff;

      }


      .confidence-value {

        position:
          relative;

        z-index:1;

        text-align:center;

      }


      .confidence-value strong {

        display:block;

        font-size:
          23px;

        color:
          var(--ink);

      }


      .confidence-value span {

        font-size:
          11px;

        color:
          var(--ink-soft);

      }


      /* ==================================================
         SECTIONS
         ================================================== */

      .interactive-section {

        margin-top:
          22px;

      }


      .interactive-section h3 {

        margin:
          0 0 12px;

      }


      /* ==================================================
         PROBABILITY
         ================================================== */

      .probability-grid {

        display:grid;

        gap:10px;

      }


      .interactive-probability {

        width:100%;

        border:
          1px solid
          #e3e9e6;

        border-radius:
          13px;

        padding:
          13px 14px;

        background:#fff;

        cursor:pointer;

        text-align:left;

        transition:
          transform .18s ease,
          border-color .18s ease,
          box-shadow .18s ease;

        font:inherit;

        color:inherit;

      }


      .interactive-probability:hover {

        transform:
          translateY(-2px);

        border-color:
          var(--brand);

        box-shadow:
          0 5px 18px
          rgba(20,45,38,.08);

      }


      .interactive-probability:focus-visible {

        outline:
          3px solid
          rgba(18,72,61,.18);

        outline-offset:
          2px;

      }


      .interactive-probability.is-highlighted {

        border-color:
          var(--brand);

        box-shadow:
          0 5px 18px
          rgba(20,45,38,.08);

      }


      .probability-top {

        display:flex;

        justify-content:
          space-between;

        align-items:center;

        margin-bottom:
          8px;

      }


      .probability-name {

        display:flex;

        align-items:center;

        gap:8px;

        font-weight:
          650;

      }


      .risk-dot {

        width:
          9px;

        height:
          9px;

        border-radius:
          50%;

        background:
          var(--brand);

      }


      .risk-dot-normal {
        background:#6c8b7e;
      }

      .risk-dot-mild {
        background:#c3942d;
      }

      .risk-dot-moderate {
        background:#b46b38;
      }

      .risk-dot-severe {
        background:#a94a4a;
      }


      .probability-track {

        height:
          8px;

        border-radius:
          999px;

        background:
          #edf1ef;

        overflow:
          hidden;

      }


      .probability-fill {

        display:block;

        height:100%;

        border-radius:
          inherit;

        background:
          var(--brand);

        transition:
          width .85s
          cubic-bezier(
            .22,
            1,
            .36,
            1
          );

      }


      .probability-more {

        display:block;

        margin-top:
          7px;

        font-size:
          11px;

        color:
          var(--ink-soft);

      }


      /* ==================================================
         RECOMMENDATIONS
         ================================================== */

      .advice-grid {

        display:grid;

        gap:9px;

      }


      .advice-card {

        width:100%;

        display:grid;

        grid-template-columns:
          30px
          1fr
          24px;

        align-items:center;

        gap:10px;

        border:
          1px solid
          #e3e9e6;

        border-radius:
          13px;

        padding:
          13px;

        background:#fff;

        cursor:pointer;

        text-align:left;

        font:inherit;

        color:inherit;

        transition:
          background .18s ease,
          border-color .18s ease,
          transform .18s ease;

      }


      .advice-card:hover {

        background:
          #f8fbf8;

        border-color:
          var(--brand);

        transform:
          translateX(2px);

      }


      .advice-card:focus-visible {

        outline:
          3px solid
          rgba(18,72,61,.18);

        outline-offset:
          2px;

      }


      .advice-number {

        width:
          30px;

        height:
          30px;

        display:grid;

        place-items:center;

        border-radius:
          50%;

        background:
          #edf4f0;

        color:
          var(--brand);

        font-weight:
          700;

        font-size:
          13px;

      }


      .advice-text {

        line-height:
          1.45;

      }


      .advice-chevron {

        font-size:
          21px;

        color:
          var(--ink-soft);

        text-align:center;

        transition:
          transform .2s ease;

      }


      .advice-card.is-open {

        background:
          #f8fbf8;

        border-color:
          var(--brand);

      }


      .advice-card.is-open
      .advice-chevron {

        transform:
          rotate(45deg);

      }


      /* ==================================================
         DISCLAIMER
         ================================================== */

      .result-disclaimer {

        margin-top:
          18px;

        padding:
          12px 14px;

        border-radius:
          12px;

        background:
          #f5f7f6;

        color:
          var(--ink-soft);

        font-size:
          12px;

        line-height:
          1.5;

      }


      /* ==================================================
         ACTION BUTTONS
         ================================================== */

      .result-actions {

        display:flex;

        gap:10px;

        flex-wrap:wrap;

        margin-top:
          20px;

      }


      .result-action {

        flex:
          1 1 180px;

        min-height:
          44px;

      }


      /* ==================================================
         MOBILE
         ================================================== */

      @media (
        max-width:650px
      ) {

        .result-hero-main {

          align-items:
            flex-start;

        }


        .confidence-ring {

          width:
            88px;

          height:
            88px;

          flex-basis:
            88px;

        }


        .result-risk-big {

          font-size:
            29px;

        }

      }

    </style>


    <!-- ====================================================
         RESULT HERO
         ==================================================== -->

    <div class="interactive-result">


      <div class="result-hero">

        <div class="result-hero-main">


          <div>

            <div
              class="result-eyebrow"
            >
              Screening result
            </div>


            <h2
              class="result-risk-big"
            >
              ${escapeHTML(risk)}
            </h2>


            <p
              class="result-summary"
            >
              ${escapeHTML(
                description
              )}
            </p>

          </div>


          <!-- CONFIDENCE -->

          <div
            class="confidence-ring"
            title="Model confidence ${confidence}%"
          >

            <div
              class="confidence-value"
            >

              <strong>
                ${confidence}%
              </strong>

              <span>
                confidence
              </span>

            </div>

          </div>


        </div>

      </div>


      <!-- ==================================================
           PROBABILITY
           ================================================== -->

      <div
        class="interactive-section"
      >

        <h3>
          Risk probability
        </h3>


        <div
          class="probability-grid"
          id="result-probabilities"
        >

          ${probabilityHTML}

        </div>

      </div>


      <!-- ==================================================
           RECOMMENDATIONS
           ================================================== -->

      ${
        adviceHTML
          ? `

            <div
              class="interactive-section"
            >

              <h3>
                Recommended next steps
              </h3>


              <div
                class="advice-grid"
                id="result-advice"
              >

                ${adviceHTML}

              </div>

            </div>

          `
          : ""
      }


      <!-- ==================================================
           DISCLAIMER
           ================================================== -->

      <div
        class="result-disclaimer"
      >

        <strong>
          Important:
        </strong>

        This is a preliminary
        screening result and is
        not a medical diagnosis.

      </div>


      <!-- ==================================================
           BUTTONS
           ================================================== -->

      <div
        class="result-actions"
      >

        <button
          type="button"
          class="btn btn-ghost result-action"
          id="result-review"
        >
          Review screening
        </button>


        <button
          type="button"
          class="btn btn-primary result-action"
          id="result-new"
        >
          Start new screening
        </button>

      </div>


    </div>

  `;


  // Make visible
  resultContent.style.display =
    "block";


  

  requestAnimationFrame(() => {

    resultContent
      .querySelectorAll(
        ".probability-fill"
      )
      .forEach(bar => {

        bar.style.width =
          bar.dataset.width;

      });

  });


  resultContent
    .querySelectorAll(
      ".interactive-probability"
    )
    .forEach(card => {


      card.addEventListener(
        "click",
        () => {


          resultContent
            .querySelectorAll(
              ".interactive-probability"
            )
            .forEach(item => {

              item.classList.remove(
                "is-highlighted"
              );


              item.setAttribute(
                "aria-expanded",
                "false"
              );


              const text =
                item.querySelector(
                  ".probability-more"
                );


              if (text) {

                text.textContent =
                  "Click to compare";

              }

            });


          card.classList.add(
            "is-highlighted"
          );


          card.setAttribute(
            "aria-expanded",
            "true"
          );


          const text =
            card.querySelector(
              ".probability-more"
            );


          if (text) {

            text.textContent =
              "Selected";

          }

        }
      );

    });


  

  resultContent
    .querySelectorAll(
      ".advice-card"
    )
    .forEach(card => {


      card.addEventListener(
        "click",
        () => {

          const open =
            card.classList.toggle(
              "is-open"
            );


          card.setAttribute(
            "aria-expanded",
            String(open)
          );

        }
      );

    });


  

  const reviewButton =
    document.getElementById(
      "result-review"
    );


  if (reviewButton) {

    reviewButton.addEventListener(
      "click",
      () => {

        currentStep = 3;

        updateStepUI();

      }
    );

  }


  

  const newButton =
    document.getElementById(
      "result-new"
    );


  if (newButton) {

    newButton.addEventListener(
      "click",
      () => {

        window.location.reload();

      }
    );

  }

}


