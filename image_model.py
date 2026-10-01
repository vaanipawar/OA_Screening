"""
image_model.py
----------------
Loads the trained DenseNet121-based OA image classifier (trained in Colab
on knee X-ray images, Normal vs Osteoarthritis) and exposes the functions
app.py needs: predict() and risk_percent_to_category().

IMPORTANT — the trained weights are NOT included in this project.
This file only defines the architecture + loading/inference code.
To make the app actually work:

  1. Finish training the model in Colab (the fusion/DenseNet pipeline
     we built together).
  2. Save/download the best checkpoint. In Colab that was:
         /content/drive/MyDrive/oa_model/oa_densenet_best.pt
  3. Copy that file into this project at:
         oa_screening/models/oa_densenet_best.pt

If the file is missing, /api/screen will return a clear error message
instead of the server crashing silently.
"""

import io
import os

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "oa_densenet_best.pt")

# index 0 / 1 — MUST match the class order used during training
# (train_ds.classes printed ['Normal', 'Osteoarthritis'] in the Colab run)
CLASSES = ["Normal", "Osteoarthritis"]

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class OAImageClassifier(nn.Module):
    """Architecture must match the Colab training code exactly — changing
    this without retraining will load weights into the wrong shapes or
    silently produce meaningless predictions."""

    def __init__(self):
        super().__init__()
        base = models.densenet121(weights=None)  # real weights come from our checkpoint below, not ImageNet
        # adapt first conv layer: 1-channel grayscale X-ray instead of 3-channel RGB
        base.features.conv0 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.features = base.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Sequential(
            nn.Linear(1024, 128), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(128, 1),  # single logit, binary classification
        )

    def forward(self, x):
        x = self.features(x)
        x = self.pool(x).flatten(1)
        return self.classifier(x).squeeze(1)


# Must match the val/test transform used in the final (re-split) Colab
# training run: resize -> grayscale -> tensor. No CLAHE was applied to
# the data the saved checkpoint was actually evaluated against.
_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=1),
    transforms.ToTensor(),
])

_model = None  # lazy-loaded singleton


def load_model():
    """Loads the model once and caches it. Raises FileNotFoundError with
    a clear message if the checkpoint hasn't been placed yet."""
    global _model
    if _model is not None:
        return _model

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Trained model weights not found at '{MODEL_PATH}'.\n"
            "Copy your trained oa_densenet_best.pt (from Google Drive, "
            "under oa_model/) into the oa_screening/models/ folder, "
            "then restart the app."
        )

    model = OAImageClassifier()
    state_dict = torch.load(MODEL_PATH, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    _model = model
    return _model


def predict(image_bytes: bytes) -> dict:
    """Takes raw image bytes (from an uploaded file) and returns the
    model's OA risk prediction."""
    model = load_model()

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _TRANSFORM(img).unsqueeze(0).to(device)

    with torch.no_grad():
        prob = torch.sigmoid(model(tensor)).item()  # P(Osteoarthritis), 0-1

    predicted_class = CLASSES[int(prob > 0.5)]

    return {
        "risk_percent": round(prob * 100, 1),
        "predicted_class": predicted_class,
        "raw_probability": prob,
    }


def risk_percent_to_category(risk_percent: float) -> str:
    """Buckets the continuous 0-100 OA probability into this app's
    existing 4-tier scheme (Normal/Mild/Moderate/Severe) so the rest of
    the app (dashboard stats, history filter, guidance text, chip colors)
    keeps working unchanged.

    NOTE: this is a practical default, NOT a clinically validated
    severity mapping. The model was trained to detect presence/absence
    of OA in an image, not to grade severity on a 4-point scale — treat
    these thresholds as adjustable, not authoritative. Tune them if you
    later calibrate against KL-grade or clinical outcome data.
    """
    if risk_percent < 20:
        return "Normal"
    elif risk_percent < 45:
        return "Mild"
    elif risk_percent < 70:
        return "Moderate"
    else:
        return "Severe"
