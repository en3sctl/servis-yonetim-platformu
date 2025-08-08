/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  Chip,
  Avatar,
  LinearProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  Assignment,
  LocationOn,
  Schedule,
  CheckCircle,
  Save,
  MyLocation,
  Note,
  CalendarToday,
  AccessTime,
} from '@mui/icons-material';
import Navigation from "@/components/Navigation";

export default function PersonnelPanel() {
  const [user, setUser] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<{ [visitId: string]: string }>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return router.push("/login");
      setUser(firebaseUser);

      const userQ = query(collection(db, "users"), where("email", "==", firebaseUser.email));
      const userSnap = await getDocs(userQ);
      const personelDoc = userSnap.docs[0]?.data();
      if (!personelDoc || personelDoc.role !== "staff") {
        alert("Bu panel sadece personel için!"); router.push("/dashboard"); return;
      }
      const teamId = personelDoc.teamId;

      const visitsQ = query(collection(db, "visits"),
        where("teamId", "==", teamId),
        where("datePlanned", "==", today)
      );
      const visitsSnap = await getDocs(visitsQ);
      setVisits(visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const custQ = query(collection(db, "customers"), where("teamId", "==", teamId));
      const custSnap = await getDocs(custQ);
      setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [router, today]);

  // GPS Check-in fonksiyonu
  const handleCheckIn = async (visitId: string) => {
    if (!navigator.geolocation) {
      alert("Tarayıcı/cihaz konum özelliğini desteklemiyor!");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: new Date().toISOString(),
      };
      await updateDoc(doc(db, "visits", visitId), {
        checkInLocation: coords,
        status: "on_progress",
      });
      setVisits((v) =>
        v.map((vs) =>
          vs.id === visitId
            ? { ...vs, checkInLocation: coords, status: "on_progress" }
            : vs
        )
      );
      setSuccessMessage("Konum başarıyla kaydedildi!");
    }, (err) => {
      alert("Konum alınamadı: " + err.message);
    });
  };

  // Açıklamayı kaydet
  const handleSaveNote = async (visitId: string) => {
    const noteText = note[visitId];
    await updateDoc(doc(db, "visits", visitId), { note: noteText });
    setVisits(vs => vs.map(v => v.id === visitId ? { ...v, note: noteText } : v));
    setSuccessMessage("Açıklama kaydedildi!");
  };

  // Servis tamamla
  const handleCompleteVisit = async (visitId: string) => {
    await updateDoc(doc(db, "visits", visitId), { status: "completed", dateCompleted: new Date().toISOString() });
    setVisits(vs => vs.map(v => v.id === visitId ? { ...v, status: "completed" } : v));
    setSuccessMessage("Servis tamamlandı!");
  };

  const completedCount = visits.filter(v => v.status === "completed").length;
  const progressPercent = visits.length > 0 ? (completedCount / visits.length) * 100 : 0;

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Navigation userRole="staff" userName={user?.email?.split('@')[0]} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <LinearProgress sx={{ width: 200 }} />
          </Box>
        ) : (
          <>
            {/* Başlık ve Tarih Seçici */}
            <Box 
              display="flex" 
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between" 
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={{ xs: 2, sm: 0 }}
              mb={4}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  Günlük Görevlerim
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Hoş geldiniz, {user?.email?.split('@')[0]}
                </Typography>
              </Box>
              <TextField
                type="date"
                value={today}
                onChange={(e) => setToday(e.target.value)}
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 150 } }}
              />
            </Box>

            {/* Günlük Özet */}
            <Box 
              display="grid" 
              gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
              gap={3} 
              mb={4}
            >
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Assignment sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {visits.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Görev
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CheckCircle sx={{ fontSize: 40, color: '#059669', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                        {completedCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tamamlandı
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Schedule sx={{ fontSize: 40, color: '#dc2626', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>
                        {visits.length - completedCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bekliyor
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* İlerleme Çubuğu */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarToday sx={{ mr: 1, color: '#2563eb' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Günlük İlerleme
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Tamamlanan Görevler</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {completedCount}/{visits.length}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0' }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  %{Math.round(progressPercent)} tamamlandı
                </Typography>
              </CardContent>
            </Card>

            {/* Görev Listesi */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Bugünkü Görevlerim
                </Typography>
                
                {visits.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" mb={1}>
                      Bugün için görev yok
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {today === new Date().toISOString().slice(0, 10) 
                        ? "Bugün için atanan ziyaret bulunmuyor." 
                        : "Seçilen tarih için atanan ziyaret bulunmuyor."}
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {visits.map((v, i) => {
                      const cust = customers.find(c => c.id === v.customerId);
                      return (
                        <Box key={v.id}>
                          <ListItem
                            sx={{
                              bgcolor: v.status === "completed" ? '#f0fdf4' : '#fff',
                              border: '1px solid',
                              borderColor: v.status === "completed" ? '#bbf7d0' : '#e2e8f0',
                              borderRadius: 2,
                              mb: 2,
                              flexDirection: 'column',
                              alignItems: 'stretch',
                            }}
                          >
                            {/* Müşteri Bilgileri */}
                            <Box 
                              display="flex" 
                              flexDirection={{ xs: "column", sm: "row" }}
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              justifyContent="space-between" 
                              width="100%" 
                              mb={2}
                              gap={{ xs: 2, sm: 0 }}
                            >
                              <Box display="flex" alignItems="center">
                                <Avatar sx={{ mr: 2, bgcolor: v.status === "completed" ? '#dcfce7' : '#dbeafe' }}>
                                  {i + 1}
                                </Avatar>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {cust?.name || "Müşteri"}
                                  </Typography>
                                  <Box display="flex" alignItems="center" mt={0.5}>
                                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {cust?.address}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                              <Chip
                                label={v.status === "completed" ? "Tamamlandı" : 
                                      v.status === "on_progress" ? "Devam Ediyor" : "Bekliyor"}
                                color={v.status === "completed" ? "success" : 
                                       v.status === "on_progress" ? "warning" : "default"}
                                icon={v.status === "completed" ? <CheckCircle /> : 
                                      v.status === "on_progress" ? <AccessTime /> : <Schedule />}
                              />
                            </Box>

                            {/* Check-in Bilgisi */}
                            {v.checkInLocation && (
                              <Paper sx={{ p: 2, mb: 2, bgcolor: '#e0f2fe' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                  <MyLocation sx={{ fontSize: 20, color: '#0277bd', mr: 1 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Konum Kaydedildi
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  Koordinatlar: {v.checkInLocation.lat.toFixed(6)}, {v.checkInLocation.lng.toFixed(6)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Zaman: {new Date(v.checkInLocation.timestamp).toLocaleString('tr-TR')}
                                </Typography>
                              </Paper>
                            )}

                            {/* Notlar */}
                            {v.status !== "completed" && (
                              <Box mb={2}>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={3}
                                  placeholder="Servis açıklaması, yapılan işlemler..."
                                  value={note[v.id] !== undefined ? note[v.id] : v.note || ""}
                                  onChange={(e) => setNote(n => ({ ...n, [v.id]: e.target.value }))}
                                  sx={{ mb: 1 }}
                                />
                                <Button
                                  size="small"
                                  startIcon={<Save />}
                                  onClick={() => handleSaveNote(v.id)}
                                  variant="outlined"
                                >
                                  Açıklamayı Kaydet
                                </Button>
                              </Box>
                            )}

                            {/* Mevcut Not Gösterimi */}
                            {v.note && (
                              <Paper sx={{ p: 2, mb: 2, bgcolor: '#fffbeb' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                  <Note sx={{ fontSize: 20, color: '#d97706', mr: 1 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Servis Notları
                                  </Typography>
                                </Box>
                                <Typography variant="body2">
                                  {v.note}
                                </Typography>
                              </Paper>
                            )}

                            {/* Aksiyon Butonları */}
                            {v.status !== "completed" && (
                              <Box display="flex" gap={2} flexWrap="wrap" flexDirection={{ xs: "column", sm: "row" }}>
                                <Button
                                  variant="contained"
                                  startIcon={<MyLocation />}
                                  onClick={() => handleCheckIn(v.id)}
                                  sx={{ 
                                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                                    },
                                    width: { xs: '100%', sm: 'auto' }
                                  }}
                                >
                                  Şimdi Buradayım
                                </Button>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleCompleteVisit(v.id)}
                                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                                >
                                  Servis Tamamlandı
                                </Button>
                              </Box>
                            )}

                            {v.status === "completed" && (
                              <Box display="flex" alignItems="center" sx={{ color: '#059669' }}>
                                <CheckCircle sx={{ mr: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Servis başarıyla tamamlandı
                                </Typography>
                              </Box>
                            )}
                          </ListItem>
                          {i < visits.length - 1 && <Divider sx={{ my: 1 }} />}
                        </Box>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>

      {/* Başarı Mesajı */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert onClose={() => setSuccessMessage("")} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
