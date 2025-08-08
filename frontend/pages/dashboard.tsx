import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/router";
import { auth, db } from "@/firebase";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  IconButton,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  People,
  Group,
  Business,
  Assignment,
  Schedule,
  CheckCircle,
  Warning,
  Refresh,
} from '@mui/icons-material';
import { collection, query, where, getDocs } from "firebase/firestore";
import Navigation from "@/components/Navigation";

interface Visit {
  id: string;
  status: string;
  customerId: string;
  datePlanned: string;
  [key: string]: unknown;
}

interface DashboardStats {
  totalCustomers: number;
  totalTeams: number;
  totalPersonnel: number;
  todayVisits: number;
  completedVisits: number;
  pendingVisits: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalTeams: 0,
    totalPersonnel: 0,
    todayVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        router.push("/login");
        return;
      }

      // İstatistikleri getir
      try {
        const companyId = user.uid;

        // Müşterileri say
        const customersQ = query(collection(db, "customers"), where("companyId", "==", companyId));
        const customersSnap = await getDocs(customersQ);
        
        // Ekipleri say
        const teamsQ = query(collection(db, "teams"), where("companyId", "==", companyId));
        const teamsSnap = await getDocs(teamsQ);
        
        // Personelleri say
        const personnelQ = query(collection(db, "users"), where("companyId", "==", companyId), where("role", "==", "staff"));
        const personnelSnap = await getDocs(personnelQ);
        
        // Bugünkü ziyaretleri getir
        const visitsQ = query(collection(db, "visits"), where("companyId", "==", companyId), where("datePlanned", "==", today));
        const visitsSnap = await getDocs(visitsQ);
        const todayVisitsData = visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Visit[];
        
        const completedCount = todayVisitsData.filter(v => v.status === "completed").length;
        const pendingCount = todayVisitsData.filter(v => v.status !== "completed").length;

        setStats({
          totalCustomers: customersSnap.size,
          totalTeams: teamsSnap.size,
          totalPersonnel: personnelSnap.size,
          todayVisits: todayVisitsData.length,
          completedVisits: completedCount,
          pendingVisits: pendingCount,
        });

        setRecentVisits(todayVisitsData.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error("Dashboard verileri yüklenirken hata:", error);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, today]);

  if (!user) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <LinearProgress sx={{ width: 200 }} />
    </Box>
  );

  const statCards = [
    {
      title: "Toplam Müşteri",
      value: stats.totalCustomers,
      icon: <Business />,
      color: "#2563eb",
      bgColor: "#eff6ff",
    },
    {
      title: "Toplam Ekip",
      value: stats.totalTeams,
      icon: <Group />,
      color: "#059669",
      bgColor: "#ecfdf5",
    },
    {
      title: "Toplam Personel",
      value: stats.totalPersonnel,
      icon: <People />,
      color: "#d97706",
      bgColor: "#fffbeb",
    },
    {
      title: "Bugünkü Ziyaret",
      value: stats.todayVisits,
      icon: <Assignment />,
      color: "#dc2626",
      bgColor: "#fef2f2",
    },
  ];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Navigation userName={user.email?.split('@')[0]} />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Başlık */}
        <Box mb={4}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Servis yönetim sisteminizin genel durumu
          </Typography>
        </Box>

        {/* İstatistik Kartları */}
        <Box 
          display="grid" 
          gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={3} 
          mb={4}
        >
          {statCards.map((card, index) => (
            <Card 
              key={index}
              sx={{ 
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, mb: 1 }}>
                      {loading ? '...' : card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: card.bgColor, color: card.color, width: 56, height: 56 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box 
          display="grid" 
          gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} 
          gap={3}
        >
          {/* Bugünkü Durum */}
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Schedule sx={{ mr: 1, color: '#2563eb' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Bugünkü Durum
                </Typography>
              </Box>
              
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Tamamlanan Ziyaretler</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {stats.completedVisits}/{stats.todayVisits}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.todayVisits > 0 ? (stats.completedVisits / stats.todayVisits) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0' }}
                />
              </Box>

              <Box display="flex" gap={2}>
                <Chip
                  icon={<CheckCircle />}
                  label={`${stats.completedVisits} Tamamlandı`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
                <Chip
                  icon={<Warning />}
                  label={`${stats.pendingVisits} Bekliyor`}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Son Ziyaretler */}
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Assignment sx={{ mr: 1, color: '#2563eb' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Bugünkü Ziyaretler
                  </Typography>
                </Box>
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Box>

              {recentVisits.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Bugün için ziyaret planlanmamış
                </Typography>
              ) : (
                <List dense>
                  {recentVisits.map((visit, index) => (
                    <ListItem key={visit.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1f5f9' }}>
                          {(index + 1)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={`Müşteri ID: ${visit.customerId}`}
                        secondary={`Durum: ${visit.status}`}
                      />
                      <Chip
                        label={visit.status === "completed" ? "Tamamlandı" : "Bekliyor"}
                        color={visit.status === "completed" ? "success" : "warning"}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
