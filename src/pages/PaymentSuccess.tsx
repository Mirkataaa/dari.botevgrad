import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaign");

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-6 pt-8 pb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Благодарим Ви!</h1>
            <p className="text-muted-foreground">
              Вашето дарение беше успешно обработено. Благодарим Ви за щедростта!
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {campaignId && (
              <Button asChild variant="outline">
                <Link to={`/campaign/${campaignId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Обратно към кампанията
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/active">
                <Heart className="mr-2 h-4 w-4" />
                Разгледай други кампании
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
