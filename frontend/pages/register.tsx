/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { useRouter } from 'next/router';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  LinearProgress,
  Avatar,
  Link,
} from '@mui/material';
import {
  Business,
  PersonAdd,
  Email,
  Lock,
  CheckCircle,
} from '@mui/icons-material';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // 1. Kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore'a firma kaydı ekle
      await setDoc(doc(db, "companies", user.uid), {
        name: companyName,
        adminUserId: user.uid,
        createdAt: new Date().toISOString(),
      });

      setSuccess('Kayıt ve firma oluşturuldu! Giriş yapabilirsin.');
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        bgcolor: '#f8fafc', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="sm">
        <Card 
          sx={{ 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box 
            sx={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              color: 'white',
              p: { xs: 3, sm: 4 },
              textAlign: 'center'
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)', 
                color: 'white',
                width: 64, 
                height: 64, 
                mx: 'auto', 
                mb: 2 
              }}
            >
              <PersonAdd sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Firma Kaydı
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Servis yönetim sisteminize hoş geldiniz
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Form */}
            <Box component="form" onSubmit={handleRegister}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Firma Adı"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Business sx={{ color: 'text.secondary', mr: 1 }} />
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  type="email"
                  label="Email Adresi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Email sx={{ color: 'text.secondary', mr: 1 }} />
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  type="password"
                  label="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  inputProps={{ minLength: 6 }}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Lock sx={{ color: 'text.secondary', mr: 1 }} />
                    ),
                  }}
                  helperText="En az 6 karakter olmalıdır"
                />
              </Box>

              {/* Alerts */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ mb: 2 }}
                  icon={<CheckCircle />}
                >
                  {success}
                </Alert>
              )}

              {/* Loading Progress */}
              {loading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                </Box>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  },
                  '&:disabled': {
                    background: '#94a3b8',
                  },
                  mb: 3
                }}
              >
                {loading ? 'Kayıt Yapılıyor...' : 'Firma Kaydı Oluştur'}
              </Button>

              {/* Login Link */}
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Zaten hesabınız var mı?{' '}
                  <Link 
                    href="/login" 
                    sx={{ 
                      color: '#2563eb', 
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Giriş Yapın
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}