/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";
import {
  Container,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Divider,
} from "@mui/material";
import {
  Route,
  LocationOn,
  Schedule,
  DirectionsCar,
  Map,
  CalendarToday,
  Group,
  Business,
  Refresh,
} from "@mui/icons-material";
import Navigation from "@/components/Navigation";

// Harita için Google library
import {
  GoogleMap,
  Polyline,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

interface OptimizedRouteMapProps {
  optimization: any;
  customers: any[];
  visits: any[];
}

function OptimizedRouteMap({
  optimization,
  customers,
  visits,
}: OptimizedRouteMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  if (!isLoaded) return <div>Harita yükleniyor...</div>;
  if (!optimization?.routes?.[0]) return <div>Harita verisi yok.</div>;

  // Yolun noktaları
  const legs = optimization.routes[0].legs;
  const path = [].concat(
    ...legs.map((leg: any) =>
      leg.steps.map((step: any) => ({
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      }))
    )
  );

  // Ziyaretler optimize sırasıyla
  const order = optimization.routes[0].waypoint_order;
  let orderedVisits = order?.map((idx: number) => visits[idx + 1]) || [];
  orderedVisits = [visits[0], ...orderedVisits];

  // İlk müşterinin konumu veya default (Varşova merkezi)
  let center = { lat: 52.2297, lng: 21.0122 };
  const firstVisit = orderedVisits[0];
  const firstCustomer = customers.find((c) => c.id === firstVisit?.customerId);
  if (firstCustomer?.location) center = firstCustomer.location;

  return (
    <div>
      <h3>Haritada Optimize Rota</h3>
      <div style={{ width: "100%", height: "400px", margin: "16px 0" }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={12}
        >
          {/* Rota Çizgisi */}
          <Polyline
            path={path}
            options={{
              strokeColor: "#1976D2",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            }}
          />
          {/* Markerlar */}
          {orderedVisits.map((v: any, idx: number) => {
            const c = customers.find((c) => c.id === v?.customerId);
            if (!c?.location) return null;
            return (
              <Marker
                key={v.id}
                position={{ lat: c.location.lat, lng: c.location.lng }}
                label={{
                  text: String(idx + 1),
                  color: "#fff",
                  fontWeight: "bold",
                }}
                title={`${idx + 1}. ${c.name}`}
              />
            );
          })}
        </GoogleMap>
      </div>
    </div>
  );
}

export default function RouteOptimizePage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState("");
  const [date, setDate] = useState("");
  const [visits, setVisits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [user, setUser] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setUser(user);
      setCompanyId(user.uid);

      // Ekipler
      const teamQ = query(
        collection(db, "teams"),
        where("companyId", "==", user.uid)
      );
      const teamSnap = await getDocs(teamQ);
      setTeams(teamSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // Müşteriler
      const custQ = query(
        collection(db, "customers"),
        where("companyId", "==", user.uid)
      );
      const custSnap = await getDocs(custQ);
      setCustomers(custSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setPageLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!teamId || !date) {
      setVisits([]);
      return;
    }
    (async () => {
      const vQ = query(
        collection(db, "visits"),
        where("companyId", "==", companyId),
        where("teamId", "==", teamId),
        where("datePlanned", "==", date)
      );
      const vSnap = await getDocs(vQ);
      setVisits(vSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    })();
  }, [teamId, date, companyId]);

  async function optimizeRoute() {
    if (!visits.length) return;
    setLoading(true);

    const waypoints = visits.map((v) => {
      const c = customers.find((c) => c.id === v.customerId);
      return c?.address || "";
    });

    if (waypoints.length < 2) {
      alert("Rota optimizasyonu için en az 2 müşteri gerekli!");
      setLoading(false);
      return;
    }

    const origin = waypoints[0];
    const destination = waypoints[0];
    const innerWaypoints = waypoints.slice(1);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(
      destination
    )}&waypoints=optimize:true|${innerWaypoints
      .map((w) => encodeURIComponent(w))
      .join("|")}&key=${apiKey}`;

    const res = await fetch(`/api/proxy-route?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    setOptimization(data);
    setSuccessMessage("Rota optimizasyonu tamamlandı!");
    setLoading(false);
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Navigation userRole="admin" userName={user?.email?.split('@')[0]} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {pageLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <LinearProgress sx={{ width: 200 }} />
          </Box>
        ) : (
          <>
            {/* Başlık */}
            <Box mb={4}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Rota Optimizasyonu
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ekip rotalarını optimize edin ve zaman tasarrufu sağlayın
              </Typography>
            </Box>

            {/* İstatistik Kartları */}
            <Box 
              display="grid" 
              gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
              gap={3} 
              mb={4}
            >
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Route sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {visits.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ziyaret Noktası
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Group sx={{ fontSize: 40, color: '#059669', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                        {teams.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Aktif Ekip
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Business sx={{ fontSize: 40, color: '#d97706', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>
                        {customers.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Müşteri
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Optimizasyon Kontrolü */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  <Map sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Rota Optimizasyonu
                </Typography>
                <Box 
                  sx={{ 
                    display: "grid", 
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                    gap: 3, 
                    alignItems: 'end',
                    mb: 3 
                  }}
                >
                  <FormControl size="small" required>
                    <InputLabel>Ekip Seç</InputLabel>
                    <Select
                      value={teamId}
                      label="Ekip Seç"
                      onChange={(e) => setTeamId(e.target.value)}
                    >
                      {teams.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    type="date"
                    label="Tarih Seç"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    size="small"
                  />

                  <Button 
                    onClick={optimizeRoute} 
                    disabled={loading || !visits.length}
                    variant="contained"
                    startIcon={loading ? <Refresh sx={{ animation: 'rotate 1s linear infinite' }} /> : <DirectionsCar />}
                    sx={{ 
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                      }
                    }}
                  >
                    {loading ? "Optimizasyon Yapılıyor..." : "Rota Optimizasyonu Yap"}
                  </Button>
                </Box>

                {/* Ziyaret Listesi */}
                {visits.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Seçilen Tarihteki Ziyaretler ({visits.length} adet)
                    </Typography>
                    <List>
                      {visits.map((v, index) => {
                        const customer = customers.find((c) => c.id === v.customerId);
                        return (
                          <ListItem
                            key={v.id}
                            sx={{
                              border: '1px solid #e2e8f0',
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: '#fff',
                            }}
                          >
                            <Avatar sx={{ mr: 2, bgcolor: '#dbeafe', color: '#2563eb', width: 32, height: 32 }}>
                              {index + 1}
                            </Avatar>
                            <ListItemText
                              primary={customer?.name || "Müşteri bulunamadı"}
                              secondary={
                                <Box display="flex" alignItems="center" mt={0.5}>
                                  <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                                  {customer?.address}
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )}

                {visits.length === 0 && teamId && date && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Seçilen ekip ve tarih için ziyaret bulunamadı.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Optimizasyon Sonuçları */}
            {optimization &&
              optimization.routes?.[0] &&
              (() => {
                const order = optimization.routes[0].waypoint_order;
                if (!order || !Array.isArray(order)) return null;

                let orderedVisits = order.map((idx: number) => visits[idx + 1]);
                orderedVisits = [visits[0], ...orderedVisits];

                const totalDistance =
                  optimization.routes[0].legs.reduce(
                    (sum: number, leg: any) => sum + (leg.distance?.value || 0),
                    0
                  ) / 1000;
                const totalDuration = Math.round(
                  optimization.routes[0].legs.reduce(
                    (sum: number, leg: any) => sum + (leg.duration?.value || 0),
                    0
                  ) / 60
                );

                return (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                        <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Optimizasyon Sonuçları
                      </Typography>
                      
                      {/* Özet Bilgiler */}
                      <Box 
                        display="grid" 
                        gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
                        gap={2} 
                        mb={3}
                      >
                        <Paper sx={{ p: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                          <Typography variant="body2" color="text.secondary">
                            Toplam Mesafe
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2563eb' }}>
                            {totalDistance.toFixed(1)} km
                          </Typography>
                        </Paper>
                        
                        <Paper sx={{ p: 2, bgcolor: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                          <Typography variant="body2" color="text.secondary">
                            Toplam Süre
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#059669' }}>
                            {totalDuration} dakika
                          </Typography>
                        </Paper>
                        
                        <Paper sx={{ p: 2, bgcolor: '#fffbeb', border: '1px solid #fed7aa' }}>
                          <Typography variant="body2" color="text.secondary">
                            Durak Sayısı
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#d97706' }}>
                            {orderedVisits.length} durak
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Rota Detayları */}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Optimize Edilmiş Rota
                      </Typography>
                      <List>
                        {optimization.routes[0].legs.map((leg: any, i: number) => {
                          const from = orderedVisits[i];
                          const to = orderedVisits[i + 1] || orderedVisits[0];
                          const fromCust = customers.find((c: any) => c.id === from?.customerId);
                          const toCust = customers.find((c: any) => c.id === to?.customerId);
                          
                          return (
                            <ListItem
                              key={i}
                              sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 1,
                                mb: 1,
                                bgcolor: '#fff',
                              }}
                            >
                              <Avatar sx={{ mr: 2, bgcolor: '#dcfce7', color: '#059669' }}>
                                {i + 1}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {fromCust?.name || "?"} ➔ {toCust?.name || "Bitiş"}
                                </Typography>
                                <Box display="flex" gap={2} mt={0.5}>
                                  <Chip 
                                    label={leg.distance.text}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={leg.duration.text}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                            </ListItem>
                          );
                        })}
                      </List>

                      <Divider sx={{ my: 3 }} />

                      {/* Harita */}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Harita Görünümü
                      </Typography>
                      <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <OptimizedRouteMap
                          optimization={optimization}
                          customers={customers}
                          visits={visits}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                );
              })()}
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
