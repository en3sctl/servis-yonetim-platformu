/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Paper,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business,
  People,
  Add,
  LocationOn,
  MonetizationOn,
  Schedule,
} from "@mui/icons-material";
import Navigation from "@/components/Navigation";

export default function CustomersPage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [serviceFrequency, setServiceFrequency] = useState("");
  const [price, setPrice] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setUser(user);
      setCompanyId(user.uid);

      const teamQ = query(
        collection(db, "teams"),
        where("companyId", "==", user.uid)
      );
      const teamSnap = await getDocs(teamQ);
      setTeams(teamSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const custQ = query(
        collection(db, "customers"),
        where("companyId", "==", user.uid)
      );
      const custSnap = await getDocs(custQ);
      setCustomers(custSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Müşteri Ekleme (Geocoding ile konum kaydı)
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !serviceFrequency || !price || !teamId) return;

    // Adresi Google ile koordinata çevir
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const geoData = await geoRes.json();
    let location = null;
    if (geoData.status === "OK" && geoData.results.length > 0) {
      location = geoData.results[0].geometry.location;
    }

    await addDoc(collection(db, "customers"), {
      name,
      address,
      serviceFrequency,
      price,
      teamId,
      companyId,
      location,
      createdAt: new Date().toISOString(),
    });

    setName("");
    setAddress("");
    setServiceFrequency("");
    setPrice("");
    setTeamId("");
    setSuccessMessage("Müşteri başarıyla eklendi!");
    router.replace(router.asPath);
  };

  // DÜZENLE AÇ
  const handleEdit = (customer: any) => {
    setEditCustomer({ ...customer });
    setEditOpen(true);
  };
  // DÜZENLE KAYDET
  const handleUpdateCustomer = async () => {
    if (!editCustomer || !editCustomer.id) return;

    // Adres değiştiyse yeniden geocoding çağır (zorunlu değil, kalite için)
    let location = editCustomer.location;
    if (
      editCustomer.address !==
      customers.find((c) => c.id === editCustomer.id)?.address
    ) {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          editCustomer.address
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const geoData = await geoRes.json();
      if (geoData.status === "OK" && geoData.results.length > 0) {
        location = geoData.results[0].geometry.location;
      }
    }
    await updateDoc(doc(db, "customers", editCustomer.id), {
      ...editCustomer,
      location,
    });
    setEditOpen(false);
    setEditCustomer(null);
    setSuccessMessage("Müşteri başarıyla güncellendi!");
    router.replace(router.asPath);
  };

  // SİL
  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Müşteri silinsin mi?")) {
      await deleteDoc(doc(db, "customers", id));
      setSuccessMessage("Müşteri başarıyla silindi!");
      router.replace(router.asPath);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Navigation userRole="admin" userName={user?.email?.split('@')[0]} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <LinearProgress sx={{ width: 200 }} />
          </Box>
        ) : (
          <>
            {/* Başlık */}
            <Box mb={4}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Müşteri Yönetimi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Müşterileri ekleyin, düzenleyin ve yönetin
              </Typography>
            </Box>

            {/* İstatistik Kartları */}
            <Box 
              display="grid" 
              gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)" }}
              gap={3} 
              mb={4}
            >
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Business sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {customers.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Müşteri
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <People sx={{ fontSize: 40, color: '#059669', mr: 2 }} />
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
            </Box>

            {/* Müşteri Ekleme Formu */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  <Add sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Yeni Müşteri Ekle
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleAddCustomer}
                  sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 3 }}
                >
                  <TextField
                    label="Müşteri Adı"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    size="small"
                  />
                  <TextField
                    label="Adres"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    size="small"
                  />
                  <TextField
                    label="Servis Sıklığı"
                    value={serviceFrequency}
                    onChange={(e) => setServiceFrequency(e.target.value)}
                    required
                    size="small"
                  />
                  <TextField
                    label="Fiyat (₺)"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputProps={{ min: 0 }}
                    required
                    size="small"
                  />
                  <Select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value as string)}
                    displayEmpty
                    required
                    size="small"
                  >
                    <MenuItem value="">Ekip Seç</MenuItem>
                    {teams.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                      }
                    }}
                  >
                    Müşteri Ekle
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Müşteri Listesi */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Müşteri Listesi
                </Typography>
                
                {customers.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" mb={1}>
                      Henüz müşteri yok
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İlk müşterinizi eklemek için yukarıdaki formu kullanın.
                    </Typography>
                  </Box>
                ) : (
                  <Box 
                    display="grid" 
                    gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }}
                    gap={3}
                  >
                    {customers.map((c) => (
                      <Card
                        key={c.id}
                        sx={{
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s',
                          '&:hover': { 
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                          },
                        }}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                {c.name}
                              </Typography>
                              <Box display="flex" alignItems="center" mb={1}>
                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {c.address}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" mb={1}>
                                <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {c.serviceFrequency}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center">
                                <MonetizationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  ₺{c.price}
                                </Typography>
                              </Box>
                            </Box>
                            <Box display="flex" gap={1}>
                              <IconButton 
                                color="primary" 
                                onClick={() => handleEdit(c)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteCustomer(c.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          {/* Ekip Bilgisi */}
                          <Chip 
                            label={teams.find(t => t.id === c.teamId)?.name || "Ekip bulunamadı"}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>

      {/* Düzenleme Dialog'u */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Müşteri Düzenle
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Müşteri Adı"
              value={editCustomer?.name || ""}
              onChange={(e) =>
                setEditCustomer((cur: any) => ({
                  ...cur,
                  name: e.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Adres"
              value={editCustomer?.address || ""}
              onChange={(e) =>
                setEditCustomer((cur: any) => ({
                  ...cur,
                  address: e.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Servis Sıklığı"
              value={editCustomer?.serviceFrequency || ""}
              onChange={(e) =>
                setEditCustomer((cur: any) => ({
                  ...cur,
                  serviceFrequency: e.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Fiyat (₺)"
              type="number"
              value={editCustomer?.price || ""}
              onChange={(e) =>
                setEditCustomer((cur: any) => ({
                  ...cur,
                  price: e.target.value,
                }))
              }
              inputProps={{ min: 0 }}
              fullWidth
            />
            <Select
              value={editCustomer?.teamId || ""}
              onChange={(e) =>
                setEditCustomer((cur: any) => ({
                  ...cur,
                  teamId: e.target.value,
                }))
              }
              displayEmpty
              fullWidth
            >
              <MenuItem value="">Ekip Seç</MenuItem>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateCustomer}
            sx={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              }
            }}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

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
