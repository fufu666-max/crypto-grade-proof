import { Header } from "@/components/Header";
import { AchievementBadge } from "@/components/AchievementBadge";
import { EncryptedScoreCard } from "@/components/EncryptedScoreCard";
import { AchievementMeter } from "@/components/AchievementMeter";
import { UploadRecordModal } from "@/components/UploadRecordModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Award, Shield } from "lucide-react";
import heroBanner from "@/assets/hero-banner.png";

const Index = () => {
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
              <CardTitle className="text-3xl">12</CardTitle>
            </CardHeader>
            <CardContent>
              <BookOpen className="h-8 w-8 text-accent" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Achievements</CardDescription>
              <CardTitle className="text-3xl">8</CardTitle>
            </CardHeader>
            <CardContent>
              <Award className="h-8 w-8 text-achievement" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Verified Certs</CardDescription>
              <CardTitle className="text-3xl">5</CardTitle>
            </CardHeader>
            <CardContent>
              <Shield className="h-8 w-8 text-accent" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">67%</CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EncryptedScoreCard 
              subject="Advanced Cryptography"
              encryptedScore="0x7a8f9c3e1d5b2a4f..."
              progress={95}
              isDecrypted={true}
            />
            <EncryptedScoreCard 
              subject="Blockchain Fundamentals"
              encryptedScore="0x3d9f8a2c4e6b1f7a..."
              progress={100}
            />
            <EncryptedScoreCard 
              subject="Smart Contract Security"
              encryptedScore="0x1e5c9d3a7f4b2e8c..."
              progress={78}
            />
            <EncryptedScoreCard 
              subject="Distributed Systems"
              encryptedScore="0x9b2f7e4a1c6d3f8e..."
              progress={60}
            />
            <EncryptedScoreCard 
              subject="Zero-Knowledge Proofs"
              encryptedScore="0x4c8e2f7a9b1d3e6f..."
              progress={45}
            />
            <EncryptedScoreCard 
              subject="Web3 Development"
              encryptedScore="0x6f3a9c2e7d4b1f8a..."
              progress={82}
            />
          </div>
        </section>

        {/* Achievements Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Achievements & Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AchievementBadge
              title="Cryptography Master"
              description="Successfully completed Advanced Cryptography with honors"
              status="verified"
              icon={<GraduationCap className="h-8 w-8 text-accent" />}
            />
            <AchievementBadge
              title="Blockchain Expert"
              description="Demonstrated excellence in Blockchain Fundamentals"
              status="unlocked"
              icon={<Award className="h-8 w-8 text-achievement" />}
            />
            <AchievementBadge
              title="Security Specialist"
              description="Complete Smart Contract Security course"
              status="locked"
            />
            <AchievementBadge
              title="Systems Architect"
              description="Master distributed systems concepts"
              status="locked"
            />
          </div>
        </section>
      </div>

      <AchievementMeter current={8} total={15} />
    </div>
  );
};

export default Index;
