import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";

const generatePassword = (length = 12) => {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join("");
};

const UserNew = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>("");

  const handleGenerate = useCallback(() => setPassword(generatePassword()), []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!fullName.trim()) throw new Error("Nome é obrigatório");
      if (!email.trim()) throw new Error("E-mail é obrigatório");
      if (!password.trim()) throw new Error("Senha é obrigatória");
      if (!role) throw new Error("Selecione um cargo");

      const { data, error } = await invokeEdgeFunction("create-user", {
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          role,
          avatar_url: null,
        },
      });

      if (error) throw new Error(error.message || "Erro ao criar usuário");
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      toast.success("Usuário criado com sucesso! E-mail de boas-vindas enviado.");
      navigate("/admin");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="max-w-lg">
      <BlurFade delay={0.05}>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-2xl font-light tracking-wider mb-1">Novo Usuário</h1>
        <p className="text-sm text-muted-foreground mb-8">Crie uma conta para um membro da equipa</p>
      </BlurFade>

      <BlurFade delay={0.15}>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: Maria Silva" required />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">E-mail *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@exemplo.com" required />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Telefone</Label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Senha *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={handleGenerate} title="Gerar nova senha">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">A senha será enviada por e-mail ao usuário.</p>
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cargo *</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="especialista">Especialista</SelectItem>
                <SelectItem value="atendimento">Recepcionista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancelar</Button>
          </div>
        </form>
      </BlurFade>
    </div>
  );
};

export default UserNew;
