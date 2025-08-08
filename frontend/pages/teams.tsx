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
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import {
  Group,
  People,
  Add,
  Edit,
  Delete,
  Business,
} from "@mui/icons-material";
import Navigation from "@/components/Navigation";

export default function TeamsPage() {
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setUser(user);
      setCompanyId(user.uid);
      const q = query(collection(db, "teams"), where("companyId", "==", user.uid));
      const snap = await getDocs(q);
      setTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;
    await addDoc(collection(db, "teams"), {
      name: teamName, companyId, createdAt: new Date().toISOString()
    });
    setTeamName("");
    setSuccessMessage("Ekip başarıyla eklendi!");
    router.replace(router.asPath);
  };

  const handleEdit = (team: any) => {
    setEditId(team.id);
    setEditTeam({ ...team });
    setEditOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (!editId || !editTeam) return;
    await updateDoc(doc(db, "teams", editId), editTeam);
    setEditId(null); setEditTeam(null); setEditOpen(false);
    setSuccessMessage("Ekip başarıyla güncellendi!");
    router.replace(router.asPath);
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm("Ekip silinsin mi?")) {
      await deleteDoc(doc(db, "teams", id));
      setSuccessMessage("Ekip başarıyla silindi!");
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
                Ekip Yönetimi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ekipleri oluşturun, düzenleyin ve yönetin
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
                    <Group sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {teams.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Ekip
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
                        {teams.length > 0 ? "Aktif" : "Yok"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Durum
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Ekip Ekleme Formu */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  <Add sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Yeni Ekip Oluştur
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleAddTeam}
                  sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                  <TextField
                    label="Ekip Adı"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    size="small"
                    sx={{ flex: 1, maxWidth: { xs: "100%", sm: 300 } }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={!teamName}
                    sx={{ 
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                      }
                    }}
                  >
                    Ekip Ekle
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Ekip Listesi */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Ekip Listesi
                </Typography>
                
                {teams.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" mb={1}>
                      Henüz ekip yok
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İlk ekibinizi oluşturmak için yukarıdaki formu kullanın.
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {teams.map((team, index) => (
                      <ListItem
                        key={team.id}
                        sx={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          mb: 2,
                          bgcolor: '#fff',
                          transition: 'all 0.2s',
                          '&:hover': { 
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          },
                        }}
                      >
                        <Avatar sx={{ mr: 2, bgcolor: '#dbeafe', color: '#2563eb' }}>
                          {index + 1}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {team.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Oluşturulma: {new Date(team.createdAt).toLocaleDateString('tr-TR')}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Chip 
                            label="Aktif"
                            color="success"
                            variant="outlined"
                            size="small"
                            sx={{ mr: 2 }}
                          />
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEdit(team)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteTeam(team.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>

      {/* Düzenleme Dialog'u */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Ekip Düzenle
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Ekip Adı"
            value={editTeam?.name || ""}
            onChange={(e) => setEditTeam((et: any) => ({ ...et, name: e.target.value }))}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateTeam}
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