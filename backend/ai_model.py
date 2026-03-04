import numpy as np
from PIL import Image
import os
from typing import Optional, Dict, Any
from groq_treatments import generate_treatments, FALLBACK_TREATMENTS

# Disease treatments database
DISEASE_TREATMENTS = {
    "Tomato___Bacterial_spot": {
        "organic": [
            "Apply copper-based bactericides",
            "Use neem oil spray weekly",
            "Remove and destroy infected plant parts",
            "Improve air circulation around plants"
        ],
        "chemical": [
            "Apply streptomycin sulfate (200 ppm)",
            "Use copper hydroxide fungicides",
            "Apply mancozeb at first sign of infection"
        ],
        "preventive": [
            "Use disease-free seeds",
            "Practice crop rotation (3-4 years)",
            "Avoid overhead irrigation",
            "Maintain proper plant spacing"
        ]
    },
    "Tomato___Early_blight": {
        "organic": [
            "Apply baking soda solution (1 tbsp per gallon)",
            "Use compost tea foliar spray",
            "Mulch around plants to prevent soil splash",
            "Apply neem oil every 7-14 days"
        ],
        "chemical": [
            "Apply chlorothalonil fungicide",
            "Use mancozeb or copper fungicides",
            "Apply azoxystrobin for severe cases"
        ],
        "preventive": [
            "Rotate crops every 2-3 years",
            "Remove plant debris after harvest",
            "Stake plants to improve air circulation",
            "Water at the base of plants"
        ]
    },
    "Tomato___Late_blight": {
        "organic": [
            "Remove and destroy all infected plants immediately",
            "Apply copper-based fungicides",
            "Use biofungicides like Bacillus subtilis"
        ],
        "chemical": [
            "Apply metalaxyl or mefenoxam",
            "Use chlorothalonil preventively",
            "Apply cymoxanil + mancozeb combination"
        ],
        "preventive": [
            "Monitor weather conditions (cool, wet weather)",
            "Use resistant varieties",
            "Avoid overhead irrigation",
            "Ensure good drainage"
        ]
    },
    "Tomato___healthy": {
        "organic": ["Continue current care practices", "Apply compost for nutrition"],
        "chemical": ["No treatment needed"],
        "preventive": [
            "Maintain regular watering schedule",
            "Monitor for early signs of disease",
            "Ensure proper nutrition"
        ]
    },
    "Potato___Early_blight": {
        "organic": [
            "Apply copper fungicide spray",
            "Use baking soda solution",
            "Remove infected leaves immediately"
        ],
        "chemical": [
            "Apply chlorothalonil at first symptoms",
            "Use mancozeb fungicide",
            "Apply azoxystrobin for severe infection"
        ],
        "preventive": [
            "Plant certified disease-free tubers",
            "Rotate crops for 3+ years",
            "Hill potatoes properly",
            "Water in the morning"
        ]
    },
    "Potato___Late_blight": {
        "organic": [
            "Remove all infected plant material",
            "Apply copper-based organic fungicides",
            "Destroy infected tubers"
        ],
        "chemical": [
            "Apply metalaxyl-based fungicides",
            "Use phosphorous acid products",
            "Apply fluopicolide for control"
        ],
        "preventive": [
            "Use resistant varieties",
            "Improve field drainage",
            "Monitor weather for blight conditions",
            "Avoid overhead irrigation"
        ]
    },
    "Potato___healthy": {
        "organic": ["Continue good practices", "Apply organic compost"],
        "chemical": ["No treatment needed"],
        "preventive": [
            "Monitor regularly for disease",
            "Maintain soil health",
            "Proper storage of harvested tubers"
        ]
    },
    "Corn_(Maize)___Common_rust": {
        "organic": [
            "Apply sulfur-based fungicides",
            "Use neem oil spray",
            "Remove heavily infected leaves"
        ],
        "chemical": [
            "Apply triazole fungicides",
            "Use strobilurin fungicides",
            "Apply propiconazole at first symptoms"
        ],
        "preventive": [
            "Plant resistant hybrids",
            "Plant early in the season",
            "Maintain proper plant nutrition",
            "Avoid excessive nitrogen"
        ]
    },
    "Corn_(Maize)___healthy": {
        "organic": ["Continue current practices", "Apply organic fertilizer"],
        "chemical": ["No treatment needed"],
        "preventive": [
            "Regular monitoring",
            "Proper irrigation management",
            "Balanced fertilization"
        ]
    },
    "Apple___Apple_scab": {
        "organic": [
            "Apply sulfur fungicide in spring",
            "Use neem oil spray",
            "Remove fallen leaves promptly"
        ],
        "chemical": [
            "Apply captan fungicide",
            "Use myclobutanil at green tip",
            "Apply mancozeb during critical periods"
        ],
        "preventive": [
            "Plant resistant varieties",
            "Rake and destroy fallen leaves",
            "Prune for good air circulation",
            "Apply dormant oil spray"
        ]
    },
    "Apple___healthy": {
        "organic": ["Apply compost around base", "Use organic mulch"],
        "chemical": ["No treatment needed"],
        "preventive": [
            "Regular pruning",
            "Monitor for pest activity",
            "Proper watering schedule"
        ]
    },
    "Grape___Black_rot": {
        "organic": [
            "Apply copper fungicide before bloom",
            "Remove mummified berries",
            "Prune for good air circulation"
        ],
        "chemical": [
            "Apply myclobutanil fungicide",
            "Use mancozeb preventively",
            "Apply captan during wet periods"
        ],
        "preventive": [
            "Remove all infected plant material",
            "Proper canopy management",
            "Avoid overhead irrigation",
            "Use resistant varieties"
        ]
    },
    "Grape___healthy": {
        "organic": ["Continue organic care", "Apply organic compost"],
        "chemical": ["No treatment needed"],
        "preventive": [
            "Regular pruning",
            "Proper training system",
            "Monitor for pests and diseases"
        ]
    },
    "default": {
        "organic": [
            "Apply neem oil spray",
            "Use compost tea as foliar feed",
            "Remove affected plant parts",
            "Improve soil health with organic matter"
        ],
        "chemical": [
            "Consult local agricultural extension for specific recommendations",
            "Use broad-spectrum fungicide if fungal",
            "Apply appropriate pesticide if pest-related"
        ],
        "preventive": [
            "Practice crop rotation",
            "Maintain proper plant spacing",
            "Ensure good drainage",
            "Monitor plants regularly for early detection"
        ]
    }
}

# Disease classes from PlantVillage dataset
DISEASE_CLASSES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Cherry_(including_sour)___Powdery_mildew',
    'Cherry_(including_sour)___healthy',
    'Corn_(Maize)___Cercospora_leaf_spot_Gray_leaf_spot',
    'Corn_(Maize)___Common_rust',
    'Corn_(Maize)___Northern_Leaf_Blight',
    'Corn_(Maize)___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper_bell___Bacterial_spot',
    'Pepper_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites_Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]


class PlantDiseaseModel:
    def __init__(self):
        self.pt_model = None   # PyTorch model
        self.tf_model = None   # TensorFlow model
        self.is_active = True
        self.accuracy = 95.2  # Pre-trained model accuracy
        self.device = None
        self.load_models()
    
    def load_models(self):
        """Load BOTH PyTorch and TensorFlow models for parallel inference"""
        base_dir = os.path.dirname(__file__)
        pt_model_path = os.path.join(base_dir, "plant_disease_model.pt")
        h5_model_path = os.path.join(base_dir, "plant_disease_model.h5")

        # --- Load PyTorch model ---
        if os.path.exists(pt_model_path):
            try:
                import torch  # type: ignore
                import torchvision.models as models  # type: ignore

                self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                num_classes = len(DISEASE_CLASSES)

                checkpoint = torch.load(pt_model_path, map_location=self.device, weights_only=False)

                # Determine model structure from checkpoint
                if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                    state_dict = checkpoint["model_state_dict"]
                elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                    state_dict = checkpoint["state_dict"]
                elif isinstance(checkpoint, dict) and any(k.startswith("fc.") or k.startswith("classifier.") or k.startswith("layer") for k in checkpoint.keys()):
                    state_dict = checkpoint
                else:
                    state_dict = None

                if state_dict is not None:
                    net = models.resnet50(weights=None)
                    in_features = net.fc.in_features
                    net.fc = torch.nn.Linear(in_features, num_classes)
                    net.load_state_dict(state_dict, strict=False)
                    net.to(self.device)
                    net.eval()
                    self.pt_model = net
                else:
                    loaded = checkpoint
                    if hasattr(loaded, 'eval'):
                        loaded.to(self.device)
                        loaded.eval()
                    self.pt_model = loaded

                print(f"✅ PyTorch model loaded successfully from {pt_model_path} (device: {self.device})")
            except ImportError:
                print("⚠️ PyTorch not installed — skipping .pt model")
            except Exception as e:
                print(f"⚠️ Error loading PyTorch model: {e}")

        # --- Load TensorFlow model ---
        if os.path.exists(h5_model_path):
            try:
                import tensorflow as tf  # type: ignore
                self.tf_model = tf.keras.models.load_model(h5_model_path)
                print(f"✅ TensorFlow model loaded successfully from {h5_model_path}")
            except ImportError:
                print("⚠️ TensorFlow not installed — skipping .h5 model")
            except Exception as e:
                print(f"⚠️ Error loading TensorFlow model: {e}")

        # Summary
        loaded = []
        if self.pt_model is not None:
            loaded.append("PyTorch (.pt)")
        if self.tf_model is not None:
            loaded.append("TensorFlow (.h5)")
        if loaded:
            print(f"🔀 Parallel inference enabled with: {', '.join(loaded)}")
        else:
            print("⚠️ No model files loaded. Using mock predictions.")
    
    def preprocess_image_tf(self, image_path: str) -> np.ndarray:
        """Preprocess image for TensorFlow/Keras model input"""
        img = Image.open(image_path)
        img = img.convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0  # Normalize to [0, 1]
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    def preprocess_image_pt(self, image_path: str):
        """Preprocess image for PyTorch model input"""
        import torch  # type: ignore
        from torchvision import transforms  # type: ignore

        transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])
        img = Image.open(image_path).convert('RGB')
        img_tensor = transform(img).unsqueeze(0)  # Add batch dimension
        return img_tensor.to(self.device)

    def _predict_pytorch(self, image_path: str, crop_type: Optional[str] = None) -> Dict[str, Any]:
        """Run prediction using PyTorch model"""
        import torch  # type: ignore
        img_tensor = self.preprocess_image_pt(image_path)
        with torch.no_grad():
            outputs = self.pt_model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence_val, predicted_idx = torch.max(probabilities, 1)
            predicted_class_idx = predicted_idx.item()
            confidence = confidence_val.item() * 100
        disease_class = DISEASE_CLASSES[predicted_class_idx]
        return self._format_result(disease_class, confidence, "pytorch")

    def _predict_tensorflow(self, image_path: str, crop_type: Optional[str] = None) -> Dict[str, Any]:
        """Run prediction using TensorFlow model"""
        img_array = self.preprocess_image_tf(image_path)
        predictions = self.tf_model.predict(img_array, verbose=0)
        predicted_class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class_idx]) * 100
        disease_class = DISEASE_CLASSES[predicted_class_idx]
        return self._format_result(disease_class, confidence, "tensorflow")

    @staticmethod
    def _format_result(disease_class: str, confidence: float, model_name: str) -> Dict[str, Any]:
        """Parse a disease class string into a structured result dict"""
        parts = disease_class.split('___')
        crop_name = parts[0].replace('_', ' ').replace('(', '').replace(')', '')
        disease_name = parts[1].replace('_', ' ') if len(parts) > 1 else 'Unknown'
        status = "healthy" if "healthy" in disease_class.lower() else "diseased"
        return {
            "crop_name": crop_name,
            "disease_name": disease_name,
            "confidence": round(confidence, 2),
            "status": status,
            "disease_class": disease_class,
            "model_used": model_name,
        }

    async def predict(self, image_path: str, crop_type: Optional[str] = None) -> Dict[str, Any]:
        """Run BOTH models in parallel and return the result with the highest confidence"""
        import asyncio

        if not self.is_active:
            raise Exception("AI model is currently disabled")

        tasks: list = []
        labels: list = []

        if self.pt_model is not None:
            tasks.append(asyncio.to_thread(self._predict_pytorch, image_path, crop_type))
            labels.append("PyTorch")
        if self.tf_model is not None:
            tasks.append(asyncio.to_thread(self._predict_tensorflow, image_path, crop_type))
            labels.append("TensorFlow")

        if not tasks:
            raise Exception("No AI models are loaded. Please ensure at least one model file (.pt or .h5) is available.")

        # Run all models concurrently
        raw_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect successful results
        valid: list = []
        for label, result in zip(labels, raw_results):
            if isinstance(result, BaseException):
                print(f"⚠️ {label} prediction failed: {result}")
            else:
                print(f"   {label} → {result['disease_name']}  confidence {result['confidence']:.2f}%")
                valid.append(result)

        if not valid:
            raise Exception("All AI models failed during prediction. Please check model files and try again.")

        # Pick the result with the highest confidence
        best = max(valid, key=lambda r: r["confidence"])
        print(f"✅ Best result from {best['model_used']} model  —  {best['disease_name']} ({best['confidence']:.2f}%)")
        return best
