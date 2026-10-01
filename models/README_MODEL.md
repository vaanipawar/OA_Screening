# Where's the model?

This app now runs a DenseNet121-based image classifier (Normal vs
Osteoarthritis, trained on knee X-ray images) instead of the old
Random Forest / synthetic tabular data model.

Training happens in Google Colab, not in this project folder — this
project only loads the finished checkpoint and serves it.

## To get the app fully working

1. Finish training in Colab (the DenseNet pipeline you already built:
   download the Kaggle "Osteoarthritis Prediction" dataset, re-split it
   with stratified sampling, train with early stopping).
2. In the Colab notebook, the best checkpoint gets saved to:
   ```
   /content/drive/MyDrive/oa_model/oa_densenet_best.pt
   ```
3. Download that single file from Google Drive to your computer.
4. Place it here, with this exact name:
   ```
   oa_screening/models/oa_densenet_best.pt
   ```
5. Start the Flask app. On startup you should see:
   ```
   OA image model loaded successfully.
   ```
   If instead you see a `WARNING — image model not ready yet`, the file
   isn't in the right place yet — the console message tells you the
   exact path it's looking for.

## If you retrain with a different architecture

`image_model.py` (in the project root, not this folder) defines the
exact model architecture (`OAImageClassifier`) and image preprocessing
(`_TRANSFORM`) used at inference time. These **must match** whatever
you actually trained in Colab — if you change the architecture there,
mirror the change here, or loading the checkpoint will fail or silently
produce meaningless predictions.
