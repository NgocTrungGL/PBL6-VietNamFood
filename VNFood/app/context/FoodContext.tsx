import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { API_HOME_URL } from "@env";
import { FoodDetails } from "../../components/FoodCard/FoodCard";

// --- 1. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU TỪ API (RAW) ---
interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
  image: string | null;
}

interface Region {
  region_id: number;
  region_name: string;
  description: string | null;
  region_image: string | null;
}

interface RawFood {
  food_id: number;
  name: string;
  description: string;
  main_image: string | null;
  avg_rating: number;
  most_popular: number; // API trả về 0 hoặc 1
  category_id: number;
  origin_region_id: number | null;
  nutrition_info: string | null;
  ingredients: string | null;
  label_id: number | null; // 👈 THÊM TRƯỜNG NÀY ĐỂ MAPPING VỚI AI
}

// --- 2. ĐỊNH NGHĨA CONTEXT ---
interface FoodContextType {
  foods: FoodDetails[]; // Dữ liệu đã xử lý sạch sẽ để hiển thị
  categories: Category[];
  regions: Region[];
  loading: boolean;
  refreshData: () => Promise<void>;
  updateFoodRating: (foodId: number, newRating: number) => void;
}

const FoodContext = createContext<FoodContextType | null>(null);

// --- 3. PROVIDER ---
export const FoodProvider = ({ children }: { children: React.ReactNode }) => {
  const [rawFoods, setRawFoods] = useState<RawFood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback URL nếu env lỗi
  const BASE_URL = API_HOME_URL || "http://192.168.1.5:5000/api";

  const fetchData = async () => {
    setLoading(true);
    try {
      // console.log("FoodContext: Đang tải dữ liệu từ", BASE_URL);

      const [foodsRes, catRes, regRes] = await Promise.all([
        fetch(`${BASE_URL}/foods`),
        fetch(`${BASE_URL}/categories`),
        fetch(`${BASE_URL}/regions`),
      ]);

      const rFoods = await foodsRes.json();
      const rCats = await catRes.json();
      const rRegs = await regRes.json();

      // Kiểm tra an toàn dữ liệu
      const validFoods = Array.isArray(rFoods) ? rFoods : (rFoods.foods || []);
      const validCats = Array.isArray(rCats) ? rCats : (rCats.categories || []);
      const validRegs = Array.isArray(rRegs) ? rRegs : (rRegs.regions || []);

      setRawFoods(validFoods);
      setCategories(validCats);
      setRegions(validRegs);

    } catch (err) {
      console.error("FoodContext Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API 1 lần khi App mở
  useEffect(() => {
    fetchData();
  }, []);

  // --- 4. XỬ LÝ DỮ LIỆU TẬP TRUNG ---
  // Dùng useMemo để tự động tính toán lại danh sách hiển thị khi rawFoods thay đổi
  const processedFoods: FoodDetails[] = useMemo(() => {
    if (!rawFoods.length) return [];

    // Tạo Map để tra cứu tên nhanh hơn
    const catMap = new Map(categories.map((c) => [c.category_id, c.category_name]));
    const regMap = new Map(regions.map((r) => [r.region_id, r.region_name]));

    return rawFoods.map((food) => {
      // Logic xử lý ảnh "bất tử"
      let imageSource;
      if (!food.main_image) {
         imageSource = { uri: "https://cdn-icons-png.flaticon.com/512/135/135161.png" };
      } else if (food.main_image.startsWith("http") || food.main_image.startsWith("data:") || food.main_image.startsWith("file:")) {
         imageSource = { uri: food.main_image };
      } else {
         // Nếu là Base64 thô từ DB -> Thêm header
         imageSource = { uri: `data:image/jpeg;base64,${food.main_image}` };
      }

      // Logic xử lý tên vùng miền
      const regionName = (food.origin_region_id && regMap.get(food.origin_region_id)) || "Việt Nam";

      // Trả về object chuẩn FoodDetails
      return {
        food_id: food.food_id.toString(), // Chuyển sang string cho thống nhất với UI
        name: food.name,
        description: food.description,
        main_image: imageSource,
        avg_rating: food.avg_rating || 0,
        most_popular: food.most_popular === 1,
        category_name: catMap.get(food.category_id) || "Khác",
        region_name: regionName,
        category_id: food.category_id,

        // Các trường bổ sung cho Detail Screen
        nutrition_info: food.nutrition_info,
        ingredients: food.ingredients,
        label_id: food.label_id, // 👈 MAP DỮ LIỆU LABEL_ID RA NGOÀI
      };
    });
  }, [rawFoods, categories, regions]);

  // --- 5. HÀM CẬP NHẬT RATING REALTIME ---
  const updateFoodRating = (foodId: number, newRating: number) => {
    // Chúng ta cập nhật vào rawFoods (dữ liệu gốc)
    // useMemo bên trên sẽ tự động phát hiện thay đổi và tính lại processedFoods
    setRawFoods((prevRawFoods) =>
      prevRawFoods.map((food) =>
        food.food_id === foodId
          ? { ...food, avg_rating: newRating } // Cập nhật rating mới vào item tương ứng
          : food
      )
    );
  };

  return (
    <FoodContext.Provider
      value={{
        foods: processedFoods,
        categories,
        regions,
        loading,
        refreshData: fetchData,
        updateFoodRating
      }}
    >
      {children}
    </FoodContext.Provider>
  );
};

// Hook để dùng nhanh ở các màn hình khác
export const useFood = () => {
  const context = useContext(FoodContext);
  if (!context) throw new Error("useFood must be used within a FoodProvider");
  return context;
};
