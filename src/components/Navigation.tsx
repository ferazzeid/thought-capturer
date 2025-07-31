import { NavLink } from 'react-router-dom';
import { MessageCircle, Lightbulb } from 'lucide-react';

export function Navigation() {
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
      isActive 
        ? 'bg-primary text-primary-foreground shadow-soft' 
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    }`;

  return (
    <nav className="bg-card border-b border-border shadow-soft">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex space-x-2">
          <NavLink to="/" end className={getLinkClass}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Input</span>
          </NavLink>
          
          <NavLink to="/ideas" className={getLinkClass}>
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm font-medium">Ideas</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}