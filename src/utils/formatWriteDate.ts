import dayjs from "dayjs";

const formatWriteDate = (date: string) => {
  return dayjs(date).format('YYYY. MM. DD');
}

export default formatWriteDate;