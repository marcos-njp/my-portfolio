import { motion } from 'framer-motion';
import { Github, ExternalLink } from 'lucide-react';

interface Project {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  github: string;
  demo?: string;
}

export default function Projects() {
  const projects: Project[] = [
    {
      title: "Project 1",
      description: "Description of your amazing project",
      image: "/project1.jpg",
      technologies: ["React", "TypeScript", "Node.js"],
      github: "https://github.com/yourusername/project1",
      demo: "https://project1-demo.com"
    },
    // Add more projects here
  ];

  return (
    <section id="projects" className="py-20 bg-black/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12"
        >
          My Projects
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-zinc-900 rounded-xl overflow-hidden transform-3d perspective-container"
            >
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative h-48">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex space-x-4">
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <Github className="w-6 h-6" />
                      </a>
                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        >
                          <ExternalLink className="w-6 h-6" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-400 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-3 py-1 bg-[#F7AB0A]/10 text-[#F7AB0A] rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}