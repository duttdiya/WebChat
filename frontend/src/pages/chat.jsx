
import { useEffect, useState } from "react";
import DesktopChat from "../components/DesktopChat";
import MobileChat from "../components/MobileChat";
import useChat from "../hooks/useChat";

function Chat() {
  const [isMobile, setIsMobile] = useState(false);
  const chat = useChat();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleResize = () => {
      setIsMobile(mediaQuery.matches);
    };

    handleResize();

    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  return isMobile ? (
    <MobileChat chat={chat} />
  ) : (
    <DesktopChat chat={chat} />
  );
}

export default Chat;
