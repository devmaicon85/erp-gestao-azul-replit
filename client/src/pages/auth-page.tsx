import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = z.object({
  organizationName: z.string().min(3, "O nome da organização deve ter pelo menos 3 caracteres"),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Create form instances
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submissions
  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao Gestão Azul",
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      // First create the organization, then register the user
      // This logic will be handled by the backend
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
        organizationName: data.organizationName, // Nome da organização que será criada
      });
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Sua conta foi criada e você está logado no sistema",
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left column - forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary h-12 w-12 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xl">GA</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Gestão Azul</CardTitle>
            <CardDescription>
              Sistema ERP completo para gestão empresarial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Cadastro</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Entrar
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Registration Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Organização</FormLabel>
                          <FormControl>
                            <Input placeholder="Sua Empresa" {...field} />
                          </FormControl>
                          <FormDescription>
                            Este será o nome do seu tenant no sistema
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seu Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome Completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Criar Conta
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center text-sm text-muted-foreground">
            <p>Gestão Azul é um sistema ERP completo, 100% responsivo</p>
            <p>Acesse em qualquer dispositivo - computador, tablet ou celular</p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right column - hero */}
      <div className="hidden lg:flex flex-1 bg-primary-700 text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6">Gerencie seu negócio com eficiência</h1>
          <ul className="space-y-4">
            <li className="flex items-center">
              <i className="ri-check-line text-2xl mr-4 text-primary-200"></i>
              <span className="text-lg">Cadastro completo de contatos, produtos e pedidos</span>
            </li>
            <li className="flex items-center">
              <i className="ri-check-line text-2xl mr-4 text-primary-200"></i>
              <span className="text-lg">Controle financeiro integrado</span>
            </li>
            <li className="flex items-center">
              <i className="ri-check-line text-2xl mr-4 text-primary-200"></i>
              <span className="text-lg">Gestão de entregas e status de pedidos</span>
            </li>
            <li className="flex items-center">
              <i className="ri-check-line text-2xl mr-4 text-primary-200"></i>
              <span className="text-lg">Relatórios detalhados para tomada de decisão</span>
            </li>
            <li className="flex items-center">
              <i className="ri-check-line text-2xl mr-4 text-primary-200"></i>
              <span className="text-lg">Interface responsiva para qualquer dispositivo</span>
            </li>
          </ul>
          
          <div className="mt-12 p-6 bg-primary-600 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Experimente gratuitamente</h3>
            <p className="text-primary-100">
              Crie sua conta e tenha acesso imediato a todas as funcionalidades do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
