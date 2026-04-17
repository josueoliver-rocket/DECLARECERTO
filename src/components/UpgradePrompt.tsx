import { Link } from "react-router-dom";
import { Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  feature: string;
  minPlan?: string;
}

export function UpgradePrompt({ feature, minPlan = "Premium" }: UpgradePromptProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col items-center text-center gap-4 py-10">
        <div className="p-4 rounded-full bg-primary/10">
          <Crown className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Recurso exclusivo do plano {minPlan}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {feature} está disponível apenas para assinantes do plano {minPlan} ou superior.
            Faça upgrade para desbloquear.
          </p>
        </div>
        <Link to="/planos">
          <Button size="lg" className="mt-2">
            <Crown className="w-5 h-5 mr-2" />
            Ver Planos
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
