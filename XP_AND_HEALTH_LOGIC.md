# XP dan Health Score Logic Documentation

## 📊 Overview

Sistem gamifikasi makanan menggunakan dua metrik utama:

1. **XP (Experience Points)** - Dihitung per porsi makanan yang dikonfirmasi
2. **Health Score** - Dihitung berdasarkan pola makan 7 hari terakhir

---

## 🎯 XP Calculation System

### Formula XP Dasar

XP dihitung berdasarkan 5 komponen nutrisi dengan bobot berbeda:

#### 1. Base Kalori (Bobot: 10 XP)

- **Target**: 500 kcal per porsi
- **Toleransi**: ±15% (425-575 kcal)
- **Skor**:
  - Dalam toleransi: **10 XP**
  - Di luar toleransi: `max(0, 10 - (deviation - 75) / 25)`
  - Setiap 25 kcal deviasi di luar toleransi mengurangi 1 XP

**Contoh:**

- 450 kcal → 10 XP (dalam toleransi)
- 600 kcal → 7 XP (deviasi 100, penalty 3)
- 300 kcal → 1 XP (deviasi 200, penalty 9)

#### 2. Protein Bonus (Bobot: +2 XP)

- **≥30g**: +2 XP
- **≥20g**: +1 XP
- **<20g**: 0 XP

#### 3. Serat Bonus (Bobot: +1 XP)

- **≥5g**: +1 XP
- **<5g**: 0 XP

#### 4. Gula Penalti (Bobot: -2 XP)

- **>30g**: -2 XP
- **>20g**: -1 XP
- **≤20g**: 0 XP

#### 5. Natrium Penalti (Bobot: -2 XP)

- **>1000mg**: -2 XP
- **>700mg**: -1 XP
- **≤700mg**: 0 XP

### Total XP Formula

```
Total XP = max(0, min(15,
  Base Kalori XP +
  Protein Bonus +
  Serat Bonus +
  Gula Penalti +
  Natrium Penalti
))
```

**Batas**: 0-15 XP per porsi

### Contoh Perhitungan XP

**Makanan: Hamburger (dari data Anda)**

- Kalori: 272 kcal → 0 XP (di bawah toleransi)
- Protein: 12.32g → 0 XP (<20g)
- Serat: 2.3g → 0 XP (<5g)
- Gula: 6.7g → 0 XP (≤20g)
- Natrium: 534mg → 0 XP (≤700mg)
- **Total: 0 XP**

**Makanan: Salad Sehat**

- Kalori: 450 kcal → 10 XP (dalam toleransi)
- Protein: 25g → 1 XP (≥20g)
- Serat: 8g → 1 XP (≥5g)
- Gula: 15g → 0 XP (≤20g)
- Natrium: 200mg → 0 XP (≤700mg)
- **Total: 12 XP**

---

## 🏆 Level System

### Level Progression

- **Base XP per level**: 100 XP
- **Increment per level**: +20 XP
- **Formula**: `XP untuk level berikutnya = 100 + (current_level × 20)`

### Level Tiers

| Level | XP Required | Level Name          | Description                   | Color   |
| ----- | ----------- | ------------------- | ----------------------------- | ------- |
| 1-4   | 100-160     | Health Beginner     | Pemula dalam perjalanan sehat | #DDA0DD |
| 5-9   | 180-260     | Health Learner      | Sedang belajar hidup sehat    | #87CEEB |
| 10-19 | 280-480     | Healthy Eater       | Pemakan sehat yang konsisten  | #32CD32 |
| 20-29 | 500-680     | Health Enthusiast   | Pecinta hidup sehat           | #CD7F32 |
| 30-49 | 700-1080    | Expert Nutritionist | Ahli nutrisi berpengalaman    | #C0C0C0 |
| 50+   | 1100+       | Master Chef         | Pakar nutrisi sejati!         | #FFD700 |

### Level Up Calculation

```javascript
while (currentXP >= xpToNextLevel) {
  currentXP -= xpToNextLevel;
  level += 1;
  xpToNextLevel = 100 + level * 20;
}
```

---

## 💚 Health Score System

### Skor Harian (0-100)

Health score dihitung berdasarkan 6 komponen nutrisi harian:

#### 1. Kalori (Bobot: 40 poin)

- **Target**: 2000 kcal ±10% (1800-2200 kcal)
- **Skor**:
  - Dalam range: 40 poin
  - Di luar range: `max(0, 40 - (deviation / 50))`
  - Setiap 50 kcal deviasi mengurangi 1 poin

#### 2. Protein (Bobot: 20 poin)

- **≥60g**: 20 poin
- **40-59g**: 10 poin
- **<40g**: 0 poin

#### 3. Serat (Bobot: 10 poin)

- **≥25g**: 10 poin
- **15-24g**: 5 poin
- **<15g**: 0 poin

#### 4. Gula (Bobot: 10 poin) - Semakin rendah semakin baik

- **≤50g**: 10 poin
- **51-80g**: 5 poin
- **>80g**: 0 poin

#### 5. Natrium (Bobot: 10 poin) - Semakin rendah semakin baik

- **≤2300mg**: 10 poin
- **2301-3000mg**: 5 poin
- **>3000mg**: 0 poin

#### 6. Lemak (Bobot: 10 poin)

- **≤70g**: 10 poin
- **71-100g**: 5 poin
- **>100g**: 0 poin

### Skor Mingguan

- **Rata-rata skor harian** selama 7 hari terakhir
- **Minimum data**: 1 hari (jika <7 hari, gunakan data yang tersedia)

### Health Status

| Skor   | Status    | Emoji | Warna   | Deskripsi       |
| ------ | --------- | ----- | ------- | --------------- |
| 75-100 | Healthy   | 💚    | #32CD32 | Sangat Sehat!   |
| 50-74  | Neutral   | 💛    | #FFD700 | Cukup Baik      |
| 0-49   | Unhealthy | ❤️    | #FF6B6B | Perlu Perbaikan |
| 0      | No Data   | ❓    | #808080 | Tidak Ada Data  |

---

## 🔄 System Flow

### 1. Food Detection Flow

```
User upload foto → ML Detection → Save dengan isConsumed=false → Return foodHistoryId
```

### 2. Food Confirmation Flow

```
User konfirmasi → Hitung XP → Update Character → Hitung Health Score → Update Character
```

### 3. Data Update Flow

```
Konfirmasi makanan →
├── Update foodHistory (isConsumed=true, consumedAt, xpGained)
├── Update character (xpPoint, level, xpToNextLevel)
└── Recalculate health score → Update character (healthPoint, statusName)
```

---

## 📈 Trend Analysis

### Health Trend (7 hari)

- **Improving**: Rata-rata 3 hari terakhir > rata-rata 3 hari sebelumnya +5 poin
- **Declining**: Rata-rata 3 hari terakhir < rata-rata 3 hari sebelumnya -5 poin
- **Stable**: Perbedaan ≤5 poin

### Trend Calculation

```javascript
recentAvg = (day[-1] + day[-2] + day[-3]) / 3;
previousAvg = (day[-4] + day[-5] + day[-6]) / 3;
trendScore = recentAvg - previousAvg;
```

---

## 🎮 Gamification Features

### XP Rewards

- **Perfect Meal** (15 XP): Semua kriteria terpenuhi
- **Healthy Choice** (10-14 XP): Sebagian besar kriteria terpenuhi
- **Decent Meal** (5-9 XP): Kriteria dasar terpenuhi
- **Needs Improvement** (1-4 XP): Beberapa kriteria terpenuhi
- **Poor Choice** (0 XP): Tidak memenuhi kriteria

### Level Benefits

- **Unlock Achievements**: Setiap level milestone
- **Status Prestige**: Level name dan warna berubah
- **Progress Tracking**: Visual progress bar ke level berikutnya

### Health Achievements

- **7-Day Streak**: Health score ≥75 selama 7 hari berturut-turut
- **Perfect Week**: Health score 100 selama 7 hari
- **Improvement**: Health score meningkat 20+ poin dalam seminggu

---

## 🔧 Configuration

### XP Parameters (Dapat Disesuaikan)

```javascript
const XP_CONFIG = {
  TARGET_CALORIES: 500,
  CALORIE_TOLERANCE: 0.15,
  PROTEIN_BONUS_THRESHOLDS: [20, 30],
  FIBER_BONUS_THRESHOLD: 5,
  SUGAR_PENALTY_THRESHOLDS: [20, 30],
  SODIUM_PENALTY_THRESHOLDS: [700, 1000],
  MAX_XP_PER_MEAL: 15,
  MIN_XP_PER_MEAL: 0,
};
```

### Health Score Parameters (Dapat Disesuaikan)

```javascript
const HEALTH_CONFIG = {
  TARGET_CALORIES: 2000,
  CALORIE_TOLERANCE: 0.1,
  TARGET_PROTEIN: 60,
  TARGET_FIBER: 25,
  TARGET_SUGAR: 50,
  TARGET_SODIUM: 2300,
  TARGET_FAT: 70,
  WEIGHTS: {
    calories: 40,
    protein: 20,
    fiber: 10,
    sugar: 10,
    sodium: 10,
    fat: 10,
  },
};
```

---

## 📊 API Endpoints

### 1. Food Detection

```
POST /api/character/food-detection
→ Returns: { foodHistoryId, predictions, fileInfo }
```

### 2. Food Confirmation

```
POST /api/character/food-confirm
Body: { foodHistoryId, confirm: boolean }
→ Returns: { xpGained, levelUp, newLevel, healthScore, healthStatus }
```

### 3. Get Food History

```
GET /api/character/food-history?page=1&limit=10&sortBy=createdAt&sortOrder=desc
→ Returns: { foodHistory[], pagination, sort }
```

### 4. Get Food Stats

```
GET /api/character/food-stats?period=30
→ Returns: { summary, averages, mostConsumedFoods, dailyBreakdown }
```

---

## 🧪 Testing Examples

### Test Case 1: Perfect Meal

```json
{
  "calories": 500,
  "protein": 35,
  "fiber": 8,
  "sugar": 15,
  "sodium": 400
}
```

**Expected XP**: 15 (10 + 2 + 1 + 0 + 0)

### Test Case 2: Unhealthy Meal

```json
{
  "calories": 800,
  "protein": 10,
  "fiber": 2,
  "sugar": 40,
  "sodium": 1200
}
```

**Expected XP**: 0 (0 + 0 + 0 - 2 - 2 = -4, clamped to 0)

### Test Case 3: Daily Health Score

```json
{
  "calories": 2000,
  "protein": 70,
  "fiber": 30,
  "sugar": 40,
  "sodium": 2000,
  "fat": 60
}
```

**Expected Health Score**: 100 (40 + 20 + 10 + 10 + 10 + 10)

---

## 🚀 Future Enhancements

### Planned Features

1. **Streak System**: Bonus XP untuk konsistensi
2. **Achievement System**: Badges untuk milestone
3. **Social Features**: Leaderboard dan challenges
4. **Personalized Goals**: Target nutrisi berdasarkan profil user
5. **Smart Recommendations**: AI-powered food suggestions
6. **Integration**: Sync dengan fitness trackers

### Advanced Analytics

1. **Nutritional Trends**: Grafik perkembangan nutrisi
2. **Correlation Analysis**: Hubungan antara makanan dan kesehatan
3. **Predictive Modeling**: Prediksi health score berdasarkan pola makan
4. **Personalized Insights**: Rekomendasi berdasarkan riwayat individual

---

## 📝 Notes

- **Data Privacy**: Semua data nutrisi disimpan lokal dan tidak dibagikan
- **Accuracy**: Health score adalah estimasi, bukan diagnosis medis
- **Flexibility**: Parameter dapat disesuaikan berdasarkan kebutuhan aplikasi
- **Scalability**: Sistem dirancang untuk menangani ribuan user secara bersamaan

---

_Dokumentasi ini akan diperbarui seiring dengan pengembangan fitur baru._
