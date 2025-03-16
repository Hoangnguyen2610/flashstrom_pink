import {
  uniqueNamesGenerator,
  adjectives,
  animals
} from 'unique-names-generator';

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const generateRandomEmail = (): {
  email: string;
  fullName: {
    prefixEmail: string;
    first_name: string;
    last_name: string;
  };
} => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'example.com'];
  const randomString = generatePrefixEmail();
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  return {
    email: `${randomString.prefixEmail}@${randomDomain}`,
    fullName: {
      prefixEmail: randomString.prefixEmail,
      first_name: randomString.first_name,
      last_name: randomString.last_name
    }
  }; // Ví dụ: "x7k9p2m4@gmail.com"
};

// Hàm tạo chuỗi ngẫu nhiên có ý nghĩa
function generatePrefixEmail() {
  const randomString = uniqueNamesGenerator({
    dictionaries: [adjectives, animals], // Kết hợp tính từ và danh từ (ví dụ: "happy" + "tiger")
    length: 2 // Số lượng từ kết hợp (2: tính từ + danh từ)
  });
  return {
    prefixEmail: `${randomString}${Math.floor(Math.random() * 100)}`,
    first_name: randomString[0],
    last_name: randomString[1]
  }; // Ví dụ: "happy-tiger"
}
