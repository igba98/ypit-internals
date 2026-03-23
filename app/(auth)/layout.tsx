export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden lg:flex w-[45%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#circles)" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <div className="text-white font-bold text-3xl tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-primary">Y</div>
            YPIT
          </div>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h1 className="text-white text-4xl font-bold font-urbanist leading-tight mb-4">
            Empowering Students, Fulfilling Dreams
          </h1>
          <p className="text-white/80 text-lg mb-12">
            Your complete study abroad management platform
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white font-bold text-xl">500+</div>
              <div className="text-white/70 text-sm">Students Placed</div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex-1">
                <div className="text-white font-bold text-xl">15+</div>
                <div className="text-white/70 text-sm">Countries</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex-1">
                <div className="text-white font-bold text-xl">98%</div>
                <div className="text-white/70 text-sm">Visa Success Rate</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-white/60 text-sm">
          Fulfill Your Joy &copy; {new Date().getFullYear()} YPIT Consultancies
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center bg-white p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
