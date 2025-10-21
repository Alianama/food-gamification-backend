# Food Gamification API Documentation

## Character & Food Detection Endpoints

### 1. Food Detection

**POST** `/api/character/food-detection`

Deteksi makanan dari gambar dan simpan ke riwayat makanan.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**

```
image: <file> (JPEG, JPG, PNG, GIF, WEBP, max 5MB)
```

**Response Success (200):**

```json
{
  "status": "success",
  "message": "Makanan berhasil dideteksi",
  "data": {
    "predictions": {
      "nutrition_info": {
        "brand_name": "Generic",
        "food_description": "No description available",
        "food_name": "Hamburger (Single Patty with Condiments)",
        "food_type": "Generic",
        "food_url": "https://foods.fatsecret.com/calories-nutrition/usda/hamburger-(single-patty-with-condiments)",
        "nutrition": {
          "calories": "272",
          "carbohydrate": "34.25",
          "fat": "9.77",
          "fiber": "2.3",
          "protein": "12.32",
          "serving_description": "1 sandwich",
          "sodium": "534",
          "sugar": "6.70"
        }
      },
      "predicted_food": "Hamburger (Single Patty with Condiments)",
      "timestamp": "2025-10-21T13:09:48.108627"
    },
    "fileInfo": {
      "originalName": "6432.jpg",
      "size": 70836,
      "type": "image/jpeg"
    },
    "foodHistoryId": 123,
    "timestamp": "2025-10-21T06:09:48.110Z"
  }
}
```

**Response Error (400):**

```json
{
  "status": "error",
  "message": "Tidak ada file yang diunggah. Silakan pilih gambar makanan.",
  "code": "NO_FILE_UPLOADED"
}
```

### 2. Get Food History

**GET** `/api/character/food-history`

Mengambil riwayat makanan pengguna dengan pagination dan sorting.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Halaman (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 10, max: 100)
- `sortBy` (optional): Field untuk sorting - `createdAt`, `foodName`, `calories` (default: createdAt)
- `sortOrder` (optional): Urutan sorting - `asc`, `desc` (default: desc)

**Example:**

```
GET /api/character/food-history?page=1&limit=20&sortBy=calories&sortOrder=desc
```

**Response Success (200):**

```json
{
  "status": "success",
  "message": "Riwayat makanan berhasil diambil",
  "data": {
    "foodHistory": [
      {
        "id": 123,
        "foodName": "Hamburger (Single Patty with Condiments)",
        "brandName": "Generic",
        "foodDescription": "No description available",
        "foodType": "Generic",
        "foodUrl": "https://foods.fatsecret.com/calories-nutrition/usda/hamburger-(single-patty-with-condiments)",
        "servingDescription": "1 sandwich",
        "calories": 272,
        "carbohydrate": 34.25,
        "fat": 9.77,
        "fiber": 2.3,
        "protein": 12.32,
        "sodium": 534,
        "sugar": 6.7,
        "createdAt": "2025-10-21T06:09:48.110Z",
        "updatedAt": "2025-10-21T06:09:48.110Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "sort": {
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

### 3. Food Confirmation

**POST** `/api/character/food-confirm`

Konfirmasi apakah makanan akan diberikan ke character atau tidak.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "foodHistoryId": 123,
  "confirm": true
}
```

**Response Success (200):**

```json
{
  "status": "success",
  "message": "Makanan berhasil dikonfirmasi!",
  "data": {
    "foodHistoryId": 123,
    "confirmed": true,
    "xpGained": 8,
    "levelUp": true,
    "newLevel": 5,
    "levelsGained": 1,
    "levelInfo": {
      "levelName": "Health Learner",
      "description": "Sedang belajar hidup sehat",
      "color": "#87CEEB"
    },
    "healthScore": 75,
    "healthStatus": "Healthy",
    "healthStatusInfo": {
      "emoji": "💚",
      "color": "#32CD32",
      "message": "Sangat Sehat!"
    },
    "xpBreakdown": {
      "baseCalorieXP": 10,
      "proteinBonus": 1,
      "fiberBonus": 1,
      "sugarPenalty": 0,
      "sodiumPenalty": 0,
      "total": 8
    },
    "nutritionRecommendations": [
      "Excellent! Protein yang tinggi membantu pertumbuhan otot dan perbaikan sel."
    ],
    "healthRecommendations": ["Excellent! Pertahankan pola makan sehat Anda."],
    "character": {
      "xpPoint": 45,
      "level": 5,
      "xpToNextLevel": 180,
      "healthPoint": 75,
      "statusName": "Healthy"
    }
  }
}
```

**Response Error (400):**

```json
{
  "status": "error",
  "message": "foodHistoryId dan confirm (boolean) diperlukan",
  "code": "INVALID_INPUT"
}
```

### 4. Get Food History

**GET** `/api/character/food-history`

Mengambil statistik makanan pengguna untuk periode tertentu.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `period` (optional): Periode dalam hari (default: 30, max: 365)

**Example:**

```
GET /api/character/food-stats?period=7
```

**Response Success (200):**

```json
{
  "status": "success",
  "message": "Statistik makanan berhasil diambil",
  "data": {
    "period": {
      "days": 30,
      "startDate": "2025-09-21T06:09:48.110Z",
      "endDate": "2025-10-21T06:09:48.110Z"
    },
    "summary": {
      "totalEntries": 25,
      "totalCalories": 6800.5,
      "totalCarbohydrate": 856.25,
      "totalFat": 244.25,
      "totalFiber": 57.5,
      "totalProtein": 308.0,
      "totalSodium": 13350.0,
      "totalSugar": 167.5
    },
    "averages": {
      "calories": 272.02,
      "carbohydrate": 34.25,
      "fat": 9.77,
      "fiber": 2.3,
      "protein": 12.32,
      "sodium": 534.0,
      "sugar": 6.7
    },
    "mostConsumedFoods": [
      {
        "foodName": "Hamburger (Single Patty with Condiments)",
        "count": 5
      },
      {
        "foodName": "Pizza Slice",
        "count": 3
      }
    ],
    "dailyBreakdown": [
      {
        "date": "2025-10-21",
        "count": 2,
        "calories": 544.0,
        "foods": ["Hamburger (Single Patty with Condiments)", "Pizza Slice"]
      }
    ]
  }
}
```

## Error Codes

| Code                     | Description                         |
| ------------------------ | ----------------------------------- |
| `NO_FILE_UPLOADED`       | Tidak ada file yang diunggah        |
| `INVALID_FILE_TYPE`      | Format file tidak didukung          |
| `FILE_TOO_LARGE`         | Ukuran file terlalu besar (max 5MB) |
| `INVALID_FILE_FIELD`     | Field file tidak valid              |
| `ML_SERVICE_ERROR`       | Error dari layanan ML               |
| `SERVICE_UNAVAILABLE`    | Layanan ML tidak tersedia           |
| `SERVICE_TIMEOUT`        | Timeout dari layanan ML             |
| `INVALID_PAGINATION`     | Parameter pagination tidak valid    |
| `INVALID_SORT_FIELD`     | Field sort tidak valid              |
| `INVALID_SORT_ORDER`     | Order sort tidak valid              |
| `INVALID_PERIOD`         | Periode tidak valid                 |
| `INVALID_INPUT`          | Input tidak valid                   |
| `FOOD_HISTORY_NOT_FOUND` | Riwayat makanan tidak ditemukan     |
| `ALREADY_CONSUMED`       | Makanan sudah dikonfirmasi          |
| `CHARACTER_NOT_FOUND`    | Character tidak ditemukan           |
| `INTERNAL_SERVER_ERROR`  | Error internal server               |

## File Upload Requirements

- **Supported formats**: JPEG, JPG, PNG, GIF, WEBP
- **Maximum size**: 5MB
- **Field name**: `image`
- **Content-Type**: `multipart/form-data`

## Authentication

Semua endpoint memerlukan authentication token:

```
Authorization: Bearer <your-jwt-token>
```
