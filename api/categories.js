const CLOTHING_CATEGORIES = [
  { id: 'all', name: 'All Items', icon: '👗' },
  { id: 'dresses', name: 'Dresses', icon: '👗' },
  { id: 'tops', name: 'Tops', icon: '👚' },
  { id: 'bottoms', name: 'Bottoms', icon: '👖' },
  { id: 'jeans', name: 'Jeans', icon: '👖' },
  { id: 'skirts', name: 'Skirts', icon: '🩱' },
  { id: 'shorts', name: 'Shorts', icon: '🩳' },
  { id: 'swimwear', name: 'Swimwear', icon: '👙' },
  { id: 'activewear', name: 'Activewear', icon: '🏃‍♀️' },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥' },
  { id: 'loungewear', name: 'Loungewear', icon: '🛋️' },
  { id: 'accessories', name: 'Accessories', icon: '👜' }
];

export default function handler(req, res) {
  res.json({ categories: CLOTHING_CATEGORIES });
}
