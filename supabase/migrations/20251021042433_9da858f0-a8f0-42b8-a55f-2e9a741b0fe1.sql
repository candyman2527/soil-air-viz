-- Create table for MQTT settings
CREATE TABLE IF NOT EXISTS public.mqtt_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  url text NOT NULL,
  port integer NOT NULL,
  topic text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mqtt_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own mqtt settings"
ON public.mqtt_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own mqtt settings"
ON public.mqtt_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own mqtt settings"
ON public.mqtt_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own mqtt settings"
ON public.mqtt_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_mqtt_settings_updated_at
BEFORE UPDATE ON public.mqtt_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();