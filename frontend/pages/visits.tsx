/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import {
  addDoc, collection, query, where, getDocs,
  updateDoc, doc, deleteDoc
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
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Snackbar,
  Alert,
  Chip,
  List,
  ListItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Assignment,
  People,
  Business,
  Add,
  Edit,
  Delete,
  CalendarToday,
  Schedule,
  CheckCircle,
  Warning,
  Cancel,
  LocationOn,
} from "@mui/icons-material";
import Navigation from "@/components/Navigation";

export default function VisitsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [date, setDate] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  // Düzenle/Sil için:
  const [editId, setEditId] = useState<string | null>(null);
  const [editVisit, setEditVisit] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setUser(user);
      setCompanyId(user.uid);

      // Ekipler
      const teamQ = query(collection(db, "teams"), where("companyId", "==", user.uid));
      const teamSnap = await getDocs(teamQ);
      setTeams(teamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Müşteriler
      const custQ = query(collection(db, "customers"), where("companyId", "==", user.uid));
      const custSnap = await getDocs(custQ);
      setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Ziyaretler
      const vQ = query(collection(db, "visits"), where("companyId", "==", user.uid));
      const vSnap = await getDocs(vQ);
      setVisits(vSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Ekle
  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedCustomerId || !date) return;

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      alert("Geçmiş bir tarihe ziyaret atanamaz!");
      return;
    }

    await addDoc(collection(db, "visits"), {
      companyId, teamId: selectedTeamId, customerId: selectedCustomerId,
      datePlanned: date, status: "planned", createdAt: new Date().toISOString()
    });

    setSelectedTeamId(""); setSelectedCustomerId(""); setDate("");
    setSuccessMessage("Ziyaret başarıyla eklendi!");
    router.replace(router.asPath);
  };

  // Düzenleye başla
  const handleEdit = (visit: any) => {
    setEditId(visit.id);
    setEditVisit({ ...visit });
    setEditOpen(true);
  };

  // Güncelle
  const handleUpdateVisit = async () => {
    if (!editId || !editVisit) return;
    await updateDoc(doc(db, "visits", editId), editVisit);
    setEditId(null); setEditVisit(null); setEditOpen(false);
    setSuccessMessage("Ziyaret başarıyla güncellendi!");
    router.replace(router.asPath);
  };

  // Sil
  const handleDeleteVisit = async (id: string) => {
    if (window.confirm("Ziyaret/görev silinsin mi?")) {
      await deleteDoc(doc(db, "visits", id));
      setSuccessMessage("Ziyaret başarıyla silindi!");
      router.replace(router.asPath);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "on_progress": return "warning"; 
      case "planned": return "info";
      case "cancelled": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle />;
      case "on_progress": return <Schedule />;
      case "planned": return <CalendarToday />;
      case "cancelled": return <Cancel />;
      default: return <Schedule />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Tamamlandı";
      case "on_progress": return "Devam Ediyor";
      case "planned": return "Planlandı";
      case "cancelled": return "İptal Edildi";
      default: return status;
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
                Ziyaret Yönetimi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ziyaretleri planlayın, takip edin ve yönetin
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
                    <Assignment sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {visits.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Ziyaret
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
                        {visits.filter(v => v.status === "completed").length}
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
                    <Schedule sx={{ fontSize: 40, color: '#d97706', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>
                        {visits.filter(v => v.status === "planned" || v.status === "on_progress").length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bekliyor
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Ziyaret Ekleme Formu */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  <Add sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Yeni Ziyaret Planla
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleAddVisit}
                  sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 3, alignItems: 'end' }}
                >
                  <FormControl size="small" required>
                    <InputLabel>Ekip Seç</InputLabel>
                    <Select
                      value={selectedTeamId}
                      label="Ekip Seç"
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                      {teams.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" required>
                    <InputLabel>Müşteri Seç</InputLabel>
                    <Select
                      value={selectedCustomerId}
                      label="Müşteri Seç"
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      disabled={!selectedTeamId}
                    >
                      {customers
                        .filter(c => !selectedTeamId || c.teamId === selectedTeamId)
                        .map(c => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name} - {c.address}
                          </MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>

                  <TextField
                    type="date"
                    label="Ziyaret Tarihi"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                    required
                    size="small"
                  />

                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={!selectedTeamId || !selectedCustomerId || !date}
                    sx={{ 
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                      }
                    }}
                  >
                    Ziyaret Ekle
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Ziyaret Listesi */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Planlanan Ziyaretler
                </Typography>
                
                {visits.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" mb={1}>
                      Henüz ziyaret yok
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İlk ziyaretinizi planlamak için yukarıdaki formu kullanın.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ bgcolor: 'transparent', overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                          <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Ekip</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Müşteri</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Tarih</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Durum</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {visits.map(v => (
                          <TableRow key={v.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Avatar sx={{ mr: 2, bgcolor: '#dbeafe', color: '#2563eb', width: 32, height: 32 }}>
                                  <People sx={{ fontSize: 16 }} />
                                </Avatar>
                                {teams.find(t => t.id === v.teamId)?.name || "Ekip bulunamadı"}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {customers.find(c => c.id === v.customerId)?.name || "Müşteri bulunamadı"}
                                </Typography>
                                <Box display="flex" alignItems="center" mt={0.5}>
                                  <LocationOn sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {customers.find(c => c.id === v.customerId)?.address}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(v.datePlanned).toLocaleDateString('tr-TR')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(v.status)}
                                label={getStatusText(v.status)}
                                color={getStatusColor(v.status) as any}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleEdit(v)}
                                  size="small"
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteVisit(v.id)}
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>

      {/* Düzenleme Dialog'u */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Ziyaret Düzenle
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <FormControl fullWidth>
              <InputLabel>Ekip</InputLabel>
              <Select
                value={editVisit?.teamId || ""}
                label="Ekip"
                onChange={(e) => setEditVisit((ev: any) => ({ ...ev, teamId: e.target.value }))}
              >
                {teams.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Müşteri</InputLabel>
              <Select
                value={editVisit?.customerId || ""}
                label="Müşteri"
                onChange={(e) => setEditVisit((ev: any) => ({ ...ev, customerId: e.target.value }))}
              >
                {customers
                  .filter(c => !editVisit?.teamId || c.teamId === editVisit.teamId)
                  .map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} - {c.address}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Ziyaret Tarihi"
              value={editVisit?.datePlanned || ""}
              onChange={(e) => setEditVisit((ev: any) => ({ ...ev, datePlanned: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={editVisit?.status || ""}
                label="Durum"
                onChange={(e) => setEditVisit((ev: any) => ({ ...ev, status: e.target.value }))}
              >
                <MenuItem value="planned">Planlandı</MenuItem>
                <MenuItem value="on_progress">Devam Ediyor</MenuItem>
                <MenuItem value="completed">Tamamlandı</MenuItem>
                <MenuItem value="cancelled">İptal Edildi</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateVisit}
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