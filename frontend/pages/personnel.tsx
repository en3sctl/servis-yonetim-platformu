/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import {
  addDoc, collection, query, where, getDocs,
  updateDoc, doc, deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged, sendPasswordResetEmail, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Email,
  Group,
  Save,
  Cancel,
} from '@mui/icons-material';
import Navigation from "@/components/Navigation";

export default function PersonnelPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editPersonnel, setEditPersonnel] = useState<any>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setCompanyId(user.uid);
      const teamQ = query(collection(db, "teams"), where("companyId", "==", user.uid));
      const teamSnap = await getDocs(teamQ);
      setTeams(teamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const staffQ = query(collection(db, "users"), where("companyId", "==", user.uid), where("role", "==", "staff"));
      const staffSnap = await getDocs(staffQ);
      setPersonnel(staffSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [router]);

  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !teamId) return;
    
    setLoading(true);
    try {
      // 1. Personeli Firebase Auth'a da kaydet (geçici şifre ile)
      const tempPassword = Math.random().toString(36).slice(-8) + "A1"; // Geçici güçlü şifre
      await createUserWithEmailAndPassword(auth, email, tempPassword);
      
      // 2. Firestore'a personel bilgilerini kaydet
      await addDoc(collection(db, "users"), {
        name, email, role: "staff", companyId, teamId, createdAt: new Date().toISOString()
      });
      
      // 3. Hemen şifre sıfırlama maili gönder
      await sendPasswordResetEmail(auth, email);
      
      setSuccessMessage(`Personel eklendi ve ${email} adresine davetiye gönderildi!`);
      setName(""); setEmail(""); setTeamId("");
      setOpenAddDialog(false);
      router.replace(router.asPath);
    } catch (error: any) {
      console.error("Personel ekleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: any) => {
    setEditId(p.id); 
    setEditPersonnel({ ...p });
  };

  const handleUpdate = async () => {
    if (!editId || !editPersonnel) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", editId), editPersonnel);
      setEditId(null); 
      setEditPersonnel(null);
      setSuccessMessage("Personel bilgileri güncellendi!");
      router.replace(router.asPath);
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, personelName: string) => {
    if (window.confirm(`${personelName} personeli silinsin mi?`)) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "users", id));
        setSuccessMessage("Personel silindi!");
        router.replace(router.asPath);
      } catch (error) {
        console.error("Silme hatası:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Navigation />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Başlık */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              Personel Yönetimi
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Personel ekleyin, düzenleyin ve yönetin
            </Typography>
          </Box>
          <Fab
            color="primary"
            aria-label="add"
            onClick={() => setOpenAddDialog(true)}
            sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}
          >
            <Add />
          </Fab>
        </Box>

        {/* İstatistikler */}
        <Box 
          display="grid" 
          gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" 
          gap={3} 
          mb={4}
        >
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                    {personnel.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Personel
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
        </Box>

        {/* Personel Tablosu */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Personel Listesi
            </Typography>
            
            {personnel.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" mb={1}>
                  Henüz personel eklenmedi
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  İlk personeli eklemek için + butonuna tıklayın
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenAddDialog(true)}
                  sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}
                >
                  Personel Ekle
                </Button>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Ad Soyad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>E-posta</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Ekip</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {personnel.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          {editId === p.id ? (
                            <TextField
                              size="small"
                              value={editPersonnel.name}
                              onChange={(e) => setEditPersonnel((ep: any) => ({ ...ep, name: e.target.value }))}
                            />
                          ) : (
                            <Box display="flex" alignItems="center">
                              <Person sx={{ mr: 1, color: 'text.secondary' }} />
                              {p.name}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {editId === p.id ? (
                            <TextField
                              size="small"
                              type="email"
                              value={editPersonnel.email}
                              onChange={(e) => setEditPersonnel((ep: any) => ({ ...ep, email: e.target.value }))}
                            />
                          ) : (
                            <Box display="flex" alignItems="center">
                              <Email sx={{ mr: 1, color: 'text.secondary' }} />
                              {p.email}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {editId === p.id ? (
                            <FormControl size="small" fullWidth>
                              <Select
                                value={editPersonnel.teamId}
                                onChange={(e) => setEditPersonnel((ep: any) => ({ ...ep, teamId: e.target.value }))}
                              >
                                {teams.map((t) => (
                                  <MenuItem key={t.id} value={t.id}>
                                    {t.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip
                              label={teams.find(t => t.id === p.teamId)?.name || "Belirsiz"}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Aktif"
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {editId === p.id ? (
                            <Box>
                              <IconButton
                                color="primary"
                                onClick={handleUpdate}
                                disabled={loading}
                              >
                                <Save />
                              </IconButton>
                              <IconButton
                                onClick={() => setEditId(null)}
                              >
                                <Cancel />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box>
                              <IconButton
                                color="primary"
                                onClick={() => handleEdit(p)}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleDelete(p.id, p.name)}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Personel Ekleme Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Person sx={{ mr: 1, color: '#2563eb' }} />
            Yeni Personel Ekle
          </Box>
        </DialogTitle>
        <form onSubmit={handleAddPersonnel}>
          <DialogContent>
            <TextField
              fullWidth
              label="Ad Soyad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              type="email"
              label="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <FormControl fullWidth required>
              <InputLabel>Ekip Seçin</InputLabel>
              <Select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                label="Ekip Seçin"
              >
                {teams.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 3 }}>
              Personel eklendikten sonra otomatik olarak şifre belirleme e-postası gönderilecektir.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAddDialog(false)}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}
            >
              {loading ? 'Ekleniyor...' : 'Personel Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Başarı Mesajı */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert onClose={() => setSuccessMessage("")} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}