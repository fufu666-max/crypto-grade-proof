import { Header } from "@/components/Header";
import { EncryptedScoreCard } from "@/components/EncryptedScoreCard";
import { UploadRecordModal } from "@/components/UploadRecordModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Award, Shield } from "lucide-react";
import { useAccount } from "wagmi";
import { useEncryptedGradeRecord } from "@/hooks/useEncryptedGradeRecord";
import heroBanner from "@/assets/hero-banner.png";
import { useEffect } from "react";

const Index = () => {
  const { isConnected } = useAccount();
  const { grades, studentAverage, globalAverage, isLoading, isDeployed, decryptGrade } = useEncryptedGradeRecord();
  
  // Debug: Log grades when they change
  useEffect(() => {
    console.log("[Index] Grades changed:", JSON.stringify(
      grades.map(g => ({
        id: g.id.toString(),
        subject: g.subject,
        decryptedScore: g.decryptedScore,
        isDecrypting: g.isDecrypting,
      })),
      null,
      2
    ));
  }, [grades]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-hero overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `url(${heroBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground">
              Learn in Privacy.<br />Prove in Public.
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Store your encrypted learning scores and progress. Only verified certificates can be decrypted—without exposing all your records.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 flex-1">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Courses</CardDescription>
              <CardTitle className="text-3xl">{isConnected && isDeployed ? grades.length : 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <BookOpen className="h-8 w-8 text-accent" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">
                {isConnected && isDeployed && studentAverage !== null ? studentAverage : "-"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Award className="h-8 w-8 text-achievement" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Decrypted Records</CardDescription>
              <CardTitle className="text-3xl">
                {isConnected && isDeployed ? grades.filter(g => g.decryptedScore !== undefined).length : 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Shield className="h-8 w-8 text-accent" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-lg">
                {!isConnected ? "Not Connected" : !isDeployed ? "Not Deployed" : isLoading ? "Loading..." : "Ready"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GraduationCap className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
        </div>

        {/* Encrypted Scores Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Encrypted Learning Records</h2>
            <UploadRecordModal />
          </div>
          {!isConnected ? (
            <div className="text-center py-12 text-muted-foreground">
              Please connect your wallet to view your encrypted learning records.
            </div>
          ) : !isDeployed ? (
            <div className="text-center py-12 text-muted-foreground">
              Contract not deployed. Please deploy the contract first.
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading grades...
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No grades submitted yet. Click "Upload Learning Record" to add your first grade.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grades.map((grade) => {
                const isDecrypted = grade.decryptedScore !== undefined;
                const progress = isDecrypted ? grade.decryptedScore! : 0;
                
                // Debug log for all grades
                console.log("[Index] Rendering grade:", JSON.stringify({
                  id: grade.id.toString(),
                  subject: grade.subject,
                  decryptedScore: grade.decryptedScore,
                  progress,
                  isDecrypted,
                  isDecrypting: grade.isDecrypting,
                  encryptedScore: grade.encryptedScore?.substring(0, 20),
                }, null, 2));
                
                return (
                  <EncryptedScoreCard
                    key={`grade-${grade.id.toString()}-${isDecrypted ? 'decrypted' : 'encrypted'}-${progress}`}
                    entryId={grade.id}
                    subject={grade.subject}
                    encryptedScore={grade.encryptedScore || "0x..."}
                    progress={progress}
                    isDecrypted={isDecrypted}
                    isDecrypting={grade.isDecrypting || false}
                    onDecrypt={decryptGrade}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Global Statistics Section (for school view) */}
        {isConnected && isDeployed && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Global Statistics</h2>
            <Card>
              <CardHeader>
                <CardTitle>School Overview</CardTitle>
                <CardDescription>Aggregated statistics from all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                    <p className="text-2xl font-bold">{grades.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Global Average</p>
                    <p className="text-2xl font-bold">
                      {globalAverage !== null ? globalAverage : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

export default Index;
