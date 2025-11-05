import { motion } from 'framer-motion';
import { useTypewriter, Cursor } from 'react-simple-typewriter';
import Image from 'next/image';

export default function Hero() {
  const [text] = useTypewriter({
    words: [
      'Hi, I\'m Your Name',
      'Developer',
      'Designer',
      'Creator'
    ],
    loop: true,
    delaySpeed: 2000
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative flex flex-col items-center justify-center h-screen perspective-container"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
      
      <motion.div 
        className="transform-3d"
        whileHover={{ rotateY: 10, rotateX: -10 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <Image
          src="/your-photo.jpg"
          alt="Profile Photo"
          width={200}
          height={200}
          className="rounded-full shadow-xl mb-8"
        />
      </motion.div>

      <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
        <span>{text}</span>
        <Cursor cursorColor="#F7AB0A" />
      </h1>

      <p className="text-lg md:text-xl text-gray-300 text-center max-w-2xl px-4">
        Welcome to my portfolio. I create amazing digital experiences.
      </p>

      <motion.div 
        className="mt-8 flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <a 
          href="#projects" 
          className="bg-[#F7AB0A] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#E09900] transition-colors"
        >
          View My Work
        </a>
        <a 
          href="#contact" 
          className="border border-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors"
        >
          Contact Me
        </a>
      </motion.div>
    </motion.div>
  );
}