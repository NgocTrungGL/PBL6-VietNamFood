import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa kiểu dữ liệu cho User (khớp với DB của bạn)
type UserType = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  avatar?: string | null;
  token?: string; // Token xác thực (nếu backend trả về JWT)
};

// Định nghĩa kiểu dữ liệu cho Context
type AuthContextType = {
  user: UserType | null;          // Thông tin user hiện tại
  isLoading: boolean;             // Trạng thái đang kiểm tra đăng nhập
  login: (userData: UserType) => Promise<void>; // Hàm đăng nhập
  logout: () => Promise<void>;    // Hàm đăng xuất
  updateUser: (updatedData: Partial<UserType>) => Promise<void>; // Hàm cập nhật user
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Kiểm tra đăng nhập khi mở App
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // Lấy dữ liệu từ bộ nhớ máy
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
    } catch (e) {
      console.log('Lỗi khi load user:', e);
    } finally {
      setIsLoading(false); // Dù có user hay không thì cũng đã check xong
    }
  };

  // 2. Hàm Đăng nhập (Gọi khi Login/Register thành công)
  const login = async (userData: UserType) => {
    setIsLoading(true);
    setUser(userData); // Cập nhật State ngay lập tức
    try {
      // Lưu xuống ổ cứng (chỉ lưu chuỗi JSON)
      await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
    } catch (e) {
      console.log('Lỗi khi lưu login:', e);
    }
    setIsLoading(false);
  };

  // 3. Hàm Đăng xuất
  const logout = async () => {
    setIsLoading(true);
    setUser(null); // Xóa State
    try {
      await AsyncStorage.removeItem('userInfo'); // Xóa khỏi ổ cứng
    } catch (e) {
      console.log('Lỗi khi logout:', e);
    }
    setIsLoading(false);
  };

  // 4. Hàm cập nhật thông tin user (Dùng cho màn Update Profile)
  const updateUser = async (updatedData: Partial<UserType>) => {
     if (!user) return;

     const newUser = { ...user, ...updatedData };
     setUser(newUser); // Cập nhật UI
     try {
         await AsyncStorage.setItem('userInfo', JSON.stringify(newUser)); // Cập nhật Storage
     } catch (e) {
         console.log('Lỗi cập nhật user storage', e);
     }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook custom để dùng nhanh ở các màn hình khác
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
