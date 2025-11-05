import { motion, Variants } from 'framer-motion';
import { useState } from 'react';
import { Menu, X, Github, MessageSquare } from 'lucide-react';

const navVariants: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};

const menuVariants: Variants = {
  open: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  closed: { 
    opacity: 0, 
    x: "100%",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  }
};

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.nav 
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="fixed w-full top-0 z-50 bg-black/50 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex-shrink-0 cursor-pointer"
              whileHover={{ scale: 1.1 }}
            >
              YourLogo
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <NavLink href="#about">About</NavLink>
                <NavLink href="#projects">Projects</NavLink>
                <NavLink href="#skills">Skills</NavLink>
                <NavLink href="#contact">Contact</NavLink>
                <motion.a
                  href="/chat"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  <MessageSquare size={20} />
                  <span>Chat with AI</span>
                </motion.a>
                <motion.a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white"
                  whileHover={{ scale: 1.2 }}
                >
                  <Github size={24} />
                </motion.a>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <motion.div
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={menuVariants}
        className="fixed inset-y-0 right-0 w-64 bg-black/90 backdrop-blur-lg p-6 z-40 md:hidden"
      >
        <div className="flex flex-col space-y-6">
          <MobileNavLink href="#about" onClick={() => setIsOpen(false)}>About</MobileNavLink>
          <MobileNavLink href="#projects" onClick={() => setIsOpen(false)}>Projects</MobileNavLink>
          <MobileNavLink href="#skills" onClick={() => setIsOpen(false)}>Skills</MobileNavLink>
          <MobileNavLink href="#contact" onClick={() => setIsOpen(false)}>Contact</MobileNavLink>
          <MobileNavLink href="/chat" onClick={() => setIsOpen(false)}>
            <div className="flex items-center space-x-2">
              <MessageSquare size={20} />
              <span>Chat with AI</span>
            </div>
          </MobileNavLink>
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white flex items-center space-x-2"
          >
            <Github size={20} />
            <span>GitHub</span>
          </a>
        </div>
      </motion.div>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}

function MobileNavLink({ href, onClick, children }: { 
  href: string; 
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className="text-gray-300 hover:text-white text-lg font-medium block"
      whileHover={{ x: 10 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}