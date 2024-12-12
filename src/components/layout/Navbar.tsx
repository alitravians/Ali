import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';
import { isAdminAuthenticated } from '@/utils/localStorage';

// Extend HTMLAttributes to include devinid
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    devinid?: string;
  }
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">وكالة العاصي</Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 rtl:space-x-reverse">
            <Link to="/" className="hover:text-blue-200 transition-colors">الرئيسية</Link>
            <Link to="/rules" className="hover:text-blue-200 transition-colors">القوانين</Link>
            <Link to="/join-moderators" className="hover:text-blue-200 transition-colors">انضمام المشرفين</Link>
            <Link to="/request-trend" className="hover:text-blue-200 transition-colors">طلب الترند</Link>
            <Link to="/team" className="hover:text-blue-200 transition-colors">فريق العمل</Link>
            <Link to="/updates" className="hover:text-blue-200 transition-colors">التحديثات</Link>

            <div devinid="1">
              {isAdminAuthenticated() ? (
                <Button asChild variant="secondary">
                  <Link to="/admin/dashboard">لوحة التحكم</Link>
                </Button>
              ) : (
                <Button asChild variant="secondary">
                  <Link to="/admin">تسجيل الدخول</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 flex flex-col space-y-4 text-right">
            <Link to="/" className="hover:text-blue-200 transition-colors py-2">الرئيسية</Link>
            <Link to="/rules" className="hover:text-blue-200 transition-colors py-2">القوانين</Link>
            <Link to="/join-moderators" className="hover:text-blue-200 transition-colors py-2">انضمام المشرفين</Link>
            <Link to="/request-trend" className="hover:text-blue-200 transition-colors py-2">طلب الترند</Link>
            <Link to="/team" className="hover:text-blue-200 transition-colors py-2">فريق العمل</Link>
            <Link to="/updates" className="hover:text-blue-200 transition-colors py-2">التحديثات</Link>

            <div className="pt-2">
              {isAdminAuthenticated() ? (
                <Button asChild variant="secondary" className="w-full justify-center">
                  <Link to="/admin/dashboard">لوحة التحكم</Link>
                </Button>
              ) : (
                <Button asChild variant="secondary" className="w-full justify-center">
                  <Link to="/admin">تسجيل الدخول</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
