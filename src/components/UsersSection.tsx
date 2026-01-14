import { User, ClipboardCheck, Settings } from "lucide-react";

const users = [
  {
    icon: User,
    title: "Farmers",
    description: "Upload leaf images and get instant disease diagnosis with treatment recommendations.",
    features: ["Upload leaf images", "Get instant diagnosis", "Receive treatment plans"],
    color: "bg-pistage",
  },
  {
    icon: ClipboardCheck,
    title: "Agricultural Officers",
    description: "Validate AI predictions and provide expert agricultural advice to farmers.",
    features: ["Validate predictions", "Provide expert advice", "Monitor crop health"],
    color: "bg-ever-green",
  },
  {
    icon: Settings,
    title: "Administrators",
    description: "Manage users, monitor system health, and ensure smooth operations.",
    features: ["Manage users and data", "Monitor system health", "Generate reports"],
    color: "bg-matcha",
  },
];

const UsersSection = () => {
  return (
    <section id="users" className="py-20 lg:py-32 bg-card">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium text-foreground mb-4">
            User Roles
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Who Can Use This?
          </h2>
          <p className="text-lg text-muted-foreground">
            Designed for everyone in the agricultural ecosystem
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {users.map((user, index) => (
            <div 
              key={user.title}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="bg-background rounded-2xl p-8 shadow-soft border border-border hover:shadow-card hover:-translate-y-1 transition-all duration-300 h-full">
                <div className={`w-16 h-16 ${user.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <user.icon className="h-8 w-8 text-resting-green" />
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {user.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {user.description}
                </p>
                
                <ul className="space-y-3">
                  {user.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 bg-early-green rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UsersSection;
