import { ExternalLink, Book, Droplets, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const SomniaLinks = () => {
  const links = [
    {
      title: "Somnia Documentation",
      url: "https://docs.somnia.network",
      icon: Book,
      description: "Technical documentation and guides"
    },
    {
      title: "Somnia Faucet",
      url: "https://faucet.somnia.network",
      icon: Droplets,
      description: "Get testnet tokens"
    },
    {
      title: "Network Information",
      url: "https://somnia.network",
      icon: FileText,
      description: "Somnia network details"
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        $ ./somnia_resources
      </h3>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 p-3 rounded-lg bg-somnia-card border border-somnia-border hover:bg-somnia-hover transition-colors group"
        >
          <link.icon className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {link.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {link.description}
            </p>
          </div>
          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      ))}
    </div>
  );
};

export default SomniaLinks;