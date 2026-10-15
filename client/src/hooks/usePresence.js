import { useEffect, useState } from "react";

export function usePresence(provider) {
  const [users, setUsers] = useState([]);

  console.log("Provider passed to usePresence:", provider);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    const update = () => {
      const states = Array.from(awareness.getStates().entries());
      console.log("Awareness states:", states);
      const list = states
        .filter(([, state]) => state.user)
        .map(([clientId, state]) => ({
          clientId,
          name: state.user.name,
          color: state.user.color,
          isLocal: clientId === awareness.clientID,
        }));
      setUsers(list);
    };

    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [provider]);

  return users;
}