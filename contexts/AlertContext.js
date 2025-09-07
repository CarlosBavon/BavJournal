import React, { createContext, useContext, useState } from "react";
import CustomAlert from "../components/CustomAlert";

const AlertContext = createContext();

export const useAlert = () => {
  return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
    type: "info",
  });

  const showAlert = (title, message, buttons = [], type = "info") => {
    setAlert({
      visible: true,
      title,
      message,
      buttons:
        buttons.length > 0 ? buttons : [{ text: "OK", onPress: () => {} }],
      type,
    });
  };

  const hideAlert = () => {
    setAlert({
      ...alert,
      visible: false,
    });
  };

  const alertFunctions = {
    show: showAlert,
    hide: hideAlert,
    info: (title, message, buttons) =>
      showAlert(title, message, buttons, "info"),
    success: (title, message, buttons) =>
      showAlert(title, message, buttons, "success"),
    error: (title, message, buttons) =>
      showAlert(title, message, buttons, "error"),
    warning: (title, message, buttons) =>
      showAlert(title, message, buttons, "warning"),
  };

  return (
    <AlertContext.Provider value={alertFunctions}>
      {children}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        type={alert.type}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};
