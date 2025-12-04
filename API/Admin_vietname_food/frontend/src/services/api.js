// Compatibility shim for older imports from `src/services/api.js`
export { FoodAPI, mapFromBackend, Favorites, Users, FoodImages, Nutrition, Recipes, Regions } from '../api';

// Keep default export similar to old file but include newer modules for compatibility
import { FoodAPI as _FoodAPI, mapFromBackend as _map, Favorites as _Fav, Users as _Users, FoodImages as _Imgs, Nutrition as _Nut, Recipes as _Rec, Regions as _Regions } from '../api';
export default { FoodAPI: _FoodAPI, mapFromBackend: _map, Favorites: _Fav, Users: _Users, FoodImages: _Imgs, Nutrition: _Nut, Recipes: _Rec, Regions: _Regions };
