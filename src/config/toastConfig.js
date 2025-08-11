import CustomToast from '../components/CustomToast';

export const toastConfig = {
  success: (props) => <CustomToast {...props} type="success" />,
  error: (props) => <CustomToast {...props} type="error" />,
  warning: (props) => <CustomToast {...props} type="warning" />,
  info: (props) => <CustomToast {...props} type="info" />,
  default: (props) => <CustomToast {...props} type="default" />,
};
