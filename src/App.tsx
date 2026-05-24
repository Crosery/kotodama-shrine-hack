import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import NpcEditor from "@/pages/NpcEditor";
import MainMenu from "@/pages/MainMenu";
import CgGallery from "@/pages/CgGallery";
import MusicGallery from "@/pages/MusicGallery";
import PreloadGate from "@/components/loader/PreloadGate";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PreloadGate><MainMenu /></PreloadGate>} />
        <Route path="/game" element={<Home />} />
        <Route path="/cg" element={<CgGallery />} />
        <Route path="/music" element={<MusicGallery />} />
        <Route path="/npc-editor" element={<NpcEditor />} />
      </Routes>
    </Router>
  );
}
