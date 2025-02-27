import React, { useState } from 'react';
import { Text, Pressable, Appearance, Dimensions } from 'react-native';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icons from '../../components/Icons/Icons';

const width = Dimensions.get('window').width;

const DatePicker = ({ date, setDate, setTime, mode = "datetime", dateType = "DD/MM/YYYY", showText = true, customStyle }) => {
    const [selectedDate, setSelectedDate] = useState(date);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const handleConfirm = (selectedDate) => {
        if (mode === "datetime") {
            if (setDate && setTime) {
                setDate(moment(selectedDate).format("YYYY-MM-DD"));
                setTime(moment(selectedDate).format("HH:mm"));
            } else {
                setTime(moment(selectedDate).format("YYYY-MM-DD HH:mm:ss"));
            }
        } else if (mode === "date") {
            setDate(moment(selectedDate).format("YYYY-MM-DD"));
        } else if (mode === "time") {
            setTime(moment(selectedDate).format("HH:mm"));
        }
        setSelectedDate(selectedDate);
        setDatePickerVisibility(false);
    };

    const getPlaceholderText = () => {
        if (mode === "date") {
            return "Click to select the date";
        } else if (mode === "time") {
            return "Click to select the time";
        } else {
            return "Click to select date and time";
        }
    };

    const getFormattedDisplayText = () => {
        if (selectedDate) {
            if (mode === "date") {
                return moment(selectedDate).format(dateType);
            } else if (mode === "time") {
                return moment(selectedDate).format("HH:mm");
            } else {
                return moment(selectedDate).format(`${dateType} HH:mm`);
            }
        } else {
            return getPlaceholderText();
        }
    };

    return (
        <Pressable onPress={() => setDatePickerVisibility(true)} style={[selectedDate ? { borderColor: '#21347B' } : {}, customStyle]}>
            <Icons name={mode === 'time' ? "Watch" : "Calendar"} size={width * 0.07} style={{ padding: width * 0.028, marginTop: width * 0.01 }} fill={"#1C274C"} />
            {showText &&
                <Text style={{ color: '#656565', fontSize: width * 0.04, marginLeft: width * 0.02 }}>
                    {getFormattedDisplayText()} - {dateType}
                </Text>
            }
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode={mode}
                isDarkModeEnabled={Appearance.getColorScheme() === 'dark'}
                onConfirm={handleConfirm}
                onCancel={() => setDatePickerVisibility(false)}
            />
        </Pressable>
    );
};
export default DatePicker;