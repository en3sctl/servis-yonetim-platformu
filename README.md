# Servis Yönetim Platformu

Saha hizmeti sunan firmalar (teknik servis, bakım, taşıma vb.) için geliştirilmiş web ve mobil uyumlu bir **Servis Yönetim Yazılımı**.

Bu sistem, her firmanın kendi çalışanlarını, müşterilerini ve servis operasyonlarını yönetebileceği merkezi bir platform sunar.  
Otomatik rota planlama, faturalandırma, raporlama ve saha çalışanı takibi gibi özellikler içerir.

---

## 🚀 Özellikler

### 🏢 Firma (Müşteri) - Panel Admini
- Kendi firması için panel oluşturma
- Servis (ekip) yönetimi
- Personel ve müşteri ekleme
- Günlük/haftalık otomatik rota planlama
- Ziyaret sonrası otomatik fatura üretimi
- Gider, rota verimliliği ve ödeme durumu raporları

### 🚐 Servis (Ekip)
- Firma altında tanımlı alt birimler
- Kendi personel ve müşteri listesi
- Görev atama ve rota oluşturma

### 👷‍♂️ Personel (Saha Çalışanı)
- Mobil cihazdan giriş yapabilme
- Günlük rota ve müşteri listesi görüntüleme
- Müşteri ziyaretlerinde **check-in** yapma
- Servis tamamlandı bilgisini girme
- İsteğe bağlı imza, fotoğraf, açıklama ekleme

### 📊 Raporlama
- Günlük / tarih aralığı bazlı ziyaret raporları
- Kat edilen yol ve servis performans ölçümleri
- Faturalandırma ve ödeme durumu raporları

---

## 🛠️ Teknik Altyapı

| Bileşen           | Teknoloji |
|-------------------|-----------|
| **Frontend (Web)** | React / Next.js |
| **Mobil**         | React Native veya PWA |
| **Backend**       | Node.js + Express |
| **Veritabanı**    | Firebase |
| **Harita / Rota** | Google Maps Directions API / Mapbox |
| **Faturalandırma**| PDFKit ile PDF üretimi |
| **Kimlik Doğrulama** | Firebase Auth |

---

## 📂 Veritabanı Modeli

### Koleksiyonlar / Tablolar
1. **firms**
   - id, firma adı, iletişim bilgileri, abonelik durumu
2. **services**
   - id, firmaya bağlı servis bilgileri, personel listesi
3. **staff**
   - id, ad-soyad, rol, bağlı olduğu servis
4. **customers**
   - id, isim, adres, fiyat, servis sıklığı
5. **jobs**
   - id, müşteri, atanmış personel, tarih, durum
6. **routes**
   - id, servis_id, tarih, rota bilgisi
7. **invoices**
   - id, iş_id, tutar, ödeme durumu

---

## 🔄 Sayfa / Senaryo Akışı

1. **Kayıt / Giriş**  
   Firma paneli oluşturulur.
2. **Firma Paneli**  
   Servis ekipleri eklenir, personel atanır.
3. **Müşteri Yönetimi**  
   Adres ve servis bilgileri eklenir.
4. **Görev Atama & Rota Oluşturma**  
   Google Maps API ile rota optimizasyonu.
5. **Saha Personeli**  
   Mobilde rota ve görevleri görüntüler, check-in yapar.
6. **Faturalandırma & Raporlama**  
   Otomatik PDF fatura, ödeme durumu takibi.

---

## ⚠️ Potansiyel Zorluklar
- Rota optimizasyon algoritmasının API limitleri
- Mobil offline kullanım senaryoları
- Fatura formatı ve vergi uyumluluğu
- Firebase güvenlik kurallarının eksiksiz yazılması

---

## 📦 Kurulum

```bash
# Backend kurulumu
cd backend
npm install
npm run dev

# Frontend kurulumu
cd frontend
npm install
npm run dev
