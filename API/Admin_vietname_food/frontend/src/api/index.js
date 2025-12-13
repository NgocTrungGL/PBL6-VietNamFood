import * as AuthModule from './auth';
import * as FoodsModule from './foods';
import * as Categories from './categories';
import * as FavoritesModule from './favorites';
import * as UsersModule from './users';
import * as FoodImagesModule from './food_images';
import * as RecipesModule from './recipes';
import * as RegionsModule from './regions';
import request from './request';

// Compatibility layer expected by existing components
export const AuthAPI = {
	login: AuthModule.login,
	register: AuthModule.register || (async (p) => { throw new Error('register not implemented'); }),
	logout: AuthModule.logout,
	getToken: AuthModule.getToken,
	currentUser: AuthModule.currentUser || AuthModule.getCurrentUser,
	// Compatibility helper used by some components (e.g. ProtectedRoute)
	isAuthenticated: () => {
		try {
			const token = AuthModule.getToken ? AuthModule.getToken() : null;
			return !!token;
		} catch (e) {
			return false;
		}
	},
};

export const FoodAPI = {
	list: (opts) => FoodsModule.listFoods(opts),
	get: (id) => FoodsModule.getFood(id),
	create: (data) => FoodsModule.createFood(data),
	update: (id, data) => FoodsModule.updateFood(id, data),
	delete: (id) => FoodsModule.deleteFood(id),
};

export const Favorites = {
  list: (opts) => FavoritesModule.listFavorites(opts),
  add: ({ user_id, food_id }) => FavoritesModule.addFavorite({ user_id, food_id }),
  remove: (user_id, food_id) => FavoritesModule.removeFavorite(user_id, food_id),
};

export const Users = {
	list: (opts) => UsersModule.listUsers(opts),
	get: (id) => UsersModule.getUser(id),
	create: (data) => UsersModule.createUser(data),
	update: (id, data) => UsersModule.updateUser(id, data),
	delete: (id) => UsersModule.deleteUser(id),
};

export const FoodImages = {
	list: (opts) => FoodImagesModule.listImages(opts),
	get: (id) => FoodImagesModule.getImage(id),
	create: (data) => FoodImagesModule.createImage(data),
	update: (id, data) => FoodImagesModule.updateImage(id, data),
	delete: (id) => FoodImagesModule.deleteImage(id),
};

export const Nutrition = {
	get: (food_id) => NutritionModule.getNutrition(food_id),
	create: (data) => NutritionModule.createNutrition(data),
	update: (food_id, data) => NutritionModule.updateNutrition(food_id, data),
	delete: (food_id) => NutritionModule.deleteNutrition(food_id),
};

export const Recipes = {
	list: (opts) => RecipesModule.listRecipes(opts),
	get: (id) => RecipesModule.getRecipe(id),
	create: (data) => RecipesModule.createRecipe(data),
	update: (id, data) => RecipesModule.updateRecipe(id, data),
	delete: (id) => RecipesModule.deleteRecipe(id),
};

export const Regions = {
	list: () => RegionsModule.listRegions(), // KHÔNG truyền opts
	get: (id) => RegionsModule.getRegion(id),
	create: (data) => RegionsModule.createRegionAPI(data),
	update: (id, data) => RegionsModule.updateRegionAPI(id, data),
	delete: (id) => RegionsModule.deleteRegionAPI(id),

	// Các hàm mở rộng bạn đã tạo trong regions.js
	getMainRegions: () => RegionsModule.getMainRegions(),
	getAllRegionsWithClassification: () => RegionsModule.getAllRegionsWithClassification(),
	getProvincesByRegion: (regionId) => RegionsModule.getProvincesByRegion(regionId),
};


export const mapFromBackend = FoodsModule.mapFromBackend;

export { Categories, request };


// Named exports `Favorites` and `Users` are already declared above as `export const`.
// Provide them also on the default export for compatibility with older imports.
export default { AuthAPI, FoodAPI, Categories, request, Favorites, Users, FoodImages, Nutrition, Recipes, Regions };
